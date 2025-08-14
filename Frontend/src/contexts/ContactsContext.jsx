import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import webSocketService from '../Login/Component/Services/WebSocketService';
import { useAuth } from '../Login/Component/Context/AuthContext';
import { upsertProfile, getStoredEmails, loadPV } from '../utils/pvStorage';
import { savePrivateChat } from '../utils/chatStorage';

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
    const { token, isAuthenticated, user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleWebSocketMessage = useCallback((rawData) => {
        let response;
        try {
            response = JSON.parse(rawData);
        } catch (e) {
            return; // Not a relevant message
        }

        const messageType = response.type; // Check for a type field if it exists

        if (messageType === 'get_contacts_response' || response.hasOwnProperty('contacts')) {
            console.log('🧠 Contacts Handler: Identified as GET_CONTACTS response.');
            setIsLoading(false);
            if (response.status === 'success') {
                setContacts(response.contacts || []);
                setError(null);
            } else {
                setContacts([]);
                setError(response.message || "لیست مخاطبین خالی است.");
            }
        } else if (messageType === 'add_contact_response' || response.hasOwnProperty('contact')) {
            console.log('🧠 Contacts Handler: Identified as ADD_CONTACT response.');
            if (response.status === 'success') {
                // ** THE FIX IS HERE **
                // Use .find() to check for existence, which is safer and clearer.
                setContacts(prev => {
                    const exists = prev.find(c => c.user_id === response.contact.user_id);
                    return exists ? prev : [...prev, response.contact];
                });
                alert('مخاطب با موفقیت اضافه شد');
                setSearchResults([]);
            } else {
                alert(`خطا در افزودن مخاطب: ${response.message}`);
            }
        } else if (messageType === 'remove_contact_response' || response.hasOwnProperty('removed_contact')) {
            console.log('🧠 Contacts Handler: Identified as REMOVE_CONTACT response.');
             if (response.status === 'success') {
                setContacts(prev => prev.filter(c => c.email !== response.removed_contact));
                alert('مخاطب با موفقیت حذف شد.');
            } else {
                alert(`خطا در حذف مخاطب: ${response.message}`);
            }
        } else if (messageType === 'search_user_response' || response.hasOwnProperty('results')) {
            console.log('🧠 Contacts Handler: Identified as SEARCH_USER response.');
             if (response.status === 'success') {
                setSearchResults(response.results || []);
            } else {
                setSearchResults([]);
            }
        } else if (messageType === 'get_profile_response' || response.hasOwnProperty('profile')) {
            // Handle get_profile result: store only profile in PV and upsert by email
            if (response.status === 'success' && response.profile && response.profile.email) {
                upsertProfile(response.profile);
            }
        } else if (response.status === 'success' && Array.isArray(response.messages)) {
            // Store messages per chat in localStorage under chat_between_me_<customUrl>
            try {
                const myEmail = user?.email;
                const first = response.messages[0] || {};
                const getField = (obj, keys) => keys.reduce((acc, k) => acc ?? obj[k], undefined);
                const sender = getField(first, ['sender', 'from', 'sender_email', 'senderEmail']);
                const receiver = getField(first, ['receiver', 'to', 'receiver_email', 'receiverEmail']);
                let peerEmail = response.with || '';
                if (!peerEmail && myEmail && sender && receiver) {
                    const meLower = String(myEmail).toLowerCase();
                    const sLower = String(sender).toLowerCase();
                    const rLower = String(receiver).toLowerCase();
                    peerEmail = sLower === meLower ? receiver : (rLower === meLower ? sender : '');
                } else if (!peerEmail) {
                    peerEmail = sender || receiver || '';
                }
                // Map to customUrl via PV
                const pv = loadPV();
                const pvMatch = (pv || []).find(p => String(p.email || '').toLowerCase() === String(peerEmail || '').toLowerCase());
                const chatKey = pvMatch?.customUrl || peerEmail || 'unknown';

                // Adapt messages into internal structure used by UI
                const adapt = (msg) => {
                    const id = msg.id || msg._id;
                    const text = msg.message || msg.text || msg.content || '';
                    const ts = msg.timestamp || msg.time || msg.created_at || new Date().toISOString();
                    const s = getField(msg, ['sender', 'from', 'sender_email', 'senderEmail']);
                    const t = getField(msg, ['receiver', 'to', 'receiver_email', 'receiverEmail']);
                    const outgoing = myEmail && s ? (String(s).toLowerCase() === String(myEmail).toLowerCase()) : !!msg.outgoing;
                    return {
                        id: id,
                        type: 'msg',
                        message: text,
                        incoming: !outgoing,
                        outgoing: outgoing,
                        sender: s,
                        receiver: t,
                        timestamp: ts,
                    };
                };
                const adapted = response.messages.map(adapt);
                // Replace existing storage with fresh server copy
                savePrivateChat(chatKey, adapted);
            } catch (err) {
                console.error('Failed to process get_messages response:', err);
            }
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            const cleanupListener = webSocketService.addGeneralListener(handleWebSocketMessage);
            return () => cleanupListener();
        }
    }, [isAuthenticated, handleWebSocketMessage]);

    const getContacts = useCallback(() => {
        if (token) {
            console.log("Requesting contact list from server...");
            setIsLoading(true);
            setError(null);
            webSocketService.send({ type: 'get_contacts', token });
        }
    }, [token]);
    
    useEffect(() => {
        if (isAuthenticated && token) { // Ensure token exists before fetching
            getContacts();
        }
    }, [isAuthenticated, token, getContacts]);

    // On load: for each PV entry that has email/customUrl, request last N messages
    useEffect(() => {
        if (!isAuthenticated || !token) return;
        try {
            const pv = loadPV();
            (pv || []).forEach((p) => {
                if (p && p.email) {
                    webSocketService.send({ type: 'get_messages', token, with: p.email, limit: 100 });
                }
            });
        } catch (e) {
            console.error('Failed to iterate PV for get_messages:', e);
        }
    }, [isAuthenticated, token]);

    // On every refresh (mount while authenticated), re-fetch profiles for stored emails in PV
    useEffect(() => {
        if (!isAuthenticated || !token) return;
        const emails = getStoredEmails();
        if (emails.length === 0) return;
        emails.forEach((email) => {
            webSocketService.send({ type: 'get_profile', token, email });
        });
    }, [isAuthenticated, token]);

    const addContact = (email) => {
        if (token) {
            webSocketService.send({ type: 'add_contact', token, email });
        }
    };

    const removeContact = (email) => {
        if (token) {
            webSocketService.send({ type: 'remove_contact', token, email });
        }
    };
    
    const searchUsers = useCallback((query) => {
        if (token && query && query.trim() !== '') {
            webSocketService.send({ type: 'search_user', token, query });
        } else {
            setSearchResults([]);
        }
    }, [token]);

    const value = {
        contacts, searchResults, isLoading, error,
        getContacts, addContact, removeContact, searchUsers, setSearchResults
    };

    return (
        <ContactsContext.Provider value={value}>
            {children}
        </ContactsContext.Provider>
    );
};

export const useContacts = () => useContext(ContactsContext);
