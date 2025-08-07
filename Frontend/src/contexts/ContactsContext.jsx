import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import webSocketService from '../Login/Component/Services/WebSocketService';
import { useAuth } from '../Login/Component/Context/AuthContext';

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
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
