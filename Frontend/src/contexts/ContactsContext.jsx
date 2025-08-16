import React, {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';
import webSocketService from '../Login/Component/Services/WebSocketService';
import { useAuth } from '../Login/Component/Context/AuthContext';
import { upsertProfile, getStoredEmails, loadPV, savePV } from '../utils/pvStorage';
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
        } else if (response.status === 'success' && Array.isArray(response.results) && response.results.some(r => r && Object.prototype.hasOwnProperty.call(r, 'online'))) {
            // Presence results: [{ email, online: 1|0 }, ...]
            try {
                const results = response.results || [];
                const map = new Map();
                results.forEach((r) => {
                    if (r && typeof r.email === 'string') map.set(r.email, Number(r.online) === 1 ? 1 : 0);
                });
                // Update contacts state by email
                setContacts((prev) => prev.map((c) => (c && c.email && map.has(c.email) ? { ...c, status: map.get(c.email) } : c)));
                // Update PV profiles status and save back
                const pv = loadPV();
                const updatedPv = (pv || []).map((p) => (p && p.email && map.has(p.email) ? { ...p, status: map.get(p.email) } : p));
                savePV(updatedPv);
            } catch (err) {
                console.error('Failed to process presence results:', err);
            }
        } else if (messageType === 'search_user_response') {
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
        } else if (response.status === 'success' && Array.isArray(response.open_chats)) {
            // Handle get_open_chats: for each email, request profile and upsert into PV when received
            try {
                const emails = response.open_chats || [];
                if (token && Array.isArray(emails)) {
                    emails.forEach((email) => {
                        if (typeof email === 'string' && email.length > 0) {
                            webSocketService.send({ type: 'get_profile', token, email });
                        }
                    });
                }
            } catch (err) {
                console.error('Failed to process open_chats:', err);
            }
        }
    }, [token, user]);

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

    // On load: request open chats list
    useEffect(() => {
        if (isAuthenticated && token) {
            webSocketService.send({ type: 'get_open_chats', token });
        }
    }, [isAuthenticated, token]);

    // On load: for each PV entry that has email/customUrl, request last N messages
    useEffect(() => {
        if (!isAuthenticated || !token) return;
        try {
            const pv = loadPV();
            (pv || []).forEach((p) => {
                if (p && p.email) {
                    webSocketService.send({ type: 'get_messages', token, with: p.email, limit: 100, order: 'asc' });
                }
            });
        } catch (e) {
            console.error('Failed to iterate PV for get_messages:', e);
        }
    }, [isAuthenticated, token]);

    // Keep latest contacts in a ref to avoid re-creating the interval on each contacts update
    const contactsRef = useRef(contacts);
    useEffect(() => { contactsRef.current = contacts; }, [contacts]);

    // Every 15 seconds, check online presence for contacts + PV emails (interval set up once per auth)
    useEffect(() => {
        if (!isAuthenticated || !token) return;
        const tick = () => {
            try {
                const pv = loadPV();
                const pvEmails = (pv || []).map((p) => p && p.email).filter((e) => typeof e === 'string');
                const contactEmails = (contactsRef.current || []).map((c) => c && c.email).filter((e) => typeof e === 'string');
                const emails = Array.from(new Set([...(pvEmails || []), ...(contactEmails || [])]));
                if (emails.length > 0) webSocketService.send({ type: 'check_online_by_emails', token, emails });
            } catch (e) {
                console.error('Presence interval failed:', e);
            }
        };
        const interval = setInterval(tick, 10000);
        tick();
        return () => clearInterval(interval);
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
