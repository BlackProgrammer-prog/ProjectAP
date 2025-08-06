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
            return; // Not a JSON message, ignore
        }

        // --- INTELLIGENT ROUTING for CONTACTS ---
        if (response.hasOwnProperty('contacts')) { // get_contacts response
            console.log('🧠 Contacts Handler: Identified as GET_CONTACTS response.');
            setIsLoading(false);
            if (response.status === 'success') {
                setContacts(response.contacts);
                setError(null);
            } else {
                setContacts([]);
                setError(response.message);
            }
        } else if (response.hasOwnProperty('contact')) { // add_contact response
            console.log('🧠 Contacts Handler: Identified as ADD_CONTACT response.');
            if (response.status === 'success') {
                // Add contact only if it's not already in the list
                setContacts(prev => prev.some(c => c.user_id === response.contact.user_id) ? prev : [...prev, response.contact]);
                alert('مخاطب با موفقیت اضافه شد');
                setSearchResults([]); // Clear search results after adding
            } else {
                alert(`خطا در افزودن مخاطب: ${response.message}`);
            }
        } else if (response.hasOwnProperty('removed_contact')) { // remove_contact response
            console.log('🧠 Contacts Handler: Identified as REMOVE_CONTACT response.');
             if (response.status === 'success') {
                setContacts(prev => prev.filter(c => c.email !== response.removed_contact));
                alert('مخاطب با موفقیت حذف شد.');
            } else {
                alert(`خطا در حذف مخاطب: ${response.message}`);
            }
        } else if (response.hasOwnProperty('results')) { // search_user response
            console.log('🧠 Contacts Handler: Identified as SEARCH_USER response.');
             if (response.status === 'success') {
                setSearchResults(response.results);
            } else {
                setSearchResults([]);
            }
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            const cleanupListener = webSocketService.addGeneralListener(handleWebSocketMessage);
            return () => {
                cleanupListener();
            };
        }
    }, [isAuthenticated, handleWebSocketMessage]);

    const getContacts = useCallback(() => {
        if (token) {
            setIsLoading(true);
            setError(null);
            webSocketService.send({ type: 'get_contacts', token });
        }
    }, [token]);
    
    useEffect(() => {
        if (isAuthenticated) {
            getContacts();
        }
    }, [isAuthenticated, getContacts]);

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
            setSearchResults([]); // Clear results if query is empty
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
