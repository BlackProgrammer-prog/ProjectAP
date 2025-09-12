import React, {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';
import webSocketService from '../Login/Component/Services/WebSocketService';
import { useAuth } from '../Login/Component/Context/AuthContext';
import { upsertProfile, getStoredEmails, loadPV, savePV } from '../utils/pvStorage';
import { savePrivateChat } from '../utils/chatStorage';
import Swal from 'sweetalert2';
import { upsertGroup } from '../utils/groupStorage';

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
    const { token, isAuthenticated, user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchError, setSearchError] = useState(null);

    // Invitation handling refs
    const invitationIdsRef = useRef(new Set());
    const invitationQueueRef = useRef([]);
    const showingInvitationRef = useRef(false);
    const invitationGroupInfoMapRef = useRef(new Map());
    const invitesRequestedRef = useRef(false);

    const maybeShowNextInvitation = useCallback(() => {
        if (showingInvitationRef.current) return;
        const next = invitationQueueRef.current.shift();
        if (!next) return;
        showingInvitationRef.current = true;

        const group = next;
        const name = group?.name || 'Group';
        const gid = group?.id;

        Swal.fire({
            title: name || 'دعوت به گروه',
            text: `شما به عضویت در گروه «${name}» دعوت شده‌اید.`,
            icon: 'info',
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'تایید عضویت',
            cancelButtonText: 'رد عضویت',
            allowOutsideClick: false,
            allowEscapeKey: false,
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                try {
                    const { token } = authContextValueRef.current || {};
                    const gidToSend = group?.id ?? group?.custom_url ?? gid;
                    if (token && gidToSend) {
                        webSocketService.send({ type: 'join_group', token, group_id: gidToSend });
                        // Remove from pending invites cache
                        try {
                            const raw = localStorage.getItem('PENDING_INVITES');
                            const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
                            const norm = String(gidToSend);
                            const next = (arr || []).filter((x) => String(x) !== norm);
                            localStorage.setItem('PENDING_INVITES', JSON.stringify(next));
                        } catch {}
                    }
                } catch {}
            }
            // If canceled or closed via X, just dismiss without action
        }).finally(() => {
            showingInvitationRef.current = false;
            maybeShowNextInvitation();
        });
    }, []);

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
        } else if (
            messageType === 'search_user_response' ||
            (response.status && Array.isArray(response.results)) ||
            (response.status === 'error' && response.code === 'NO_RESULTS')
        ) {
            console.log('🧠 Contacts Handler: Identified as SEARCH_USER response.');
            if (response.status === 'success') {
                setSearchResults(response.results || []);
                setSearchError(null);
            } else {
                setSearchResults([]);
                setSearchError(response.message || 'نتیجه‌ای یافت نشد');
            }
        } else if (
            messageType === 'add_contact_response' ||
            response.hasOwnProperty('contact') ||
            (response.status === 'error' && response.code === 'USER_NOT_FOUND')
        ) {
            console.log('🧠 Contacts Handler: Identified as ADD_CONTACT response.');
            if (response.status === 'success' && response.contact) {
                // ** THE FIX IS HERE **
                // Use .find() to check for existence, which is safer and clearer.
                setContacts(prev => {
                    const exists = prev.find(c => c.user_id === response.contact.user_id);
                    return exists ? prev : [...prev, response.contact];
                });
                alert('مخاطب با موفقیت اضافه شد');
                setSearchResults([]);
                setSearchError(null);
            } else {
                const msg = response.message || 'کاربر مورد نظر یافت نشد';
                alert(`خطا در افزودن مخاطب: ${msg}`);
            }
        } else if (messageType === 'remove_contact_response' || response.hasOwnProperty('removed_contact')) {
            console.log('🧠 Contacts Handler: Identified as REMOVE_CONTACT response.');
             if (response.status === 'success') {
                setContacts(prev => prev.filter(c => c.email !== response.removed_contact));
                alert('مخاطب با موفقیت حذف شد.');
            } else {
                alert(`خطا در حذف مخاطب: ${response.message}`);
            }
        } else if (messageType === 'get_profile_response' || response.hasOwnProperty('profile')) {
            // Handle get_profile result: store only profile in PV and upsert by email
            if (response.status === 'success' && response.profile && response.profile.email) {
                upsertProfile(response.profile);
            }
        } else if (messageType === 'get_and_clear_invitations_response' || (response.status === 'success' && Array.isArray(response.invitations))) {
            try {
                const invitesRaw = Array.isArray(response.invitations) ? response.invitations : [];
                // Keep a normalized set for matching regardless of type (string/number)
                const normalizedSet = new Set(invitesRaw.filter((v) => v !== null && v !== undefined).map((v) => String(v)));
                invitationIdsRef.current = normalizedSet;
                // Persist pending invites for cross-component checks (e.g., Group list UI)
                try { localStorage.setItem('PENDING_INVITES', JSON.stringify(Array.from(normalizedSet))); } catch {}
                if (invitesRaw.length > 0 && token) {
                    invitesRaw.forEach((groupId) => {
                        try { webSocketService.send({ type: 'get_group_info', token, group_id: groupId }); } catch {}
                    });
                }
            } catch (e) {
                console.error('Failed to process invitations:', e);
            }
        } else if (messageType === 'get_group_info_response' || (response.status === 'success' && response.group && (response.group.id || response.group.custom_url))) {
            // If this group is part of invitations, queue a prompt and persist under 'inv'
            if (response.status === 'success' && response.group && (response.group.id || response.group.custom_url)) {
                const g = response.group;
                const gNorm = (g.id !== undefined && g.id !== null) ? String(g.id) : (g.custom_url !== undefined && g.custom_url !== null ? String(g.custom_url) : null);
                if (gNorm && invitationIdsRef.current.has(gNorm)) {
                    invitationGroupInfoMapRef.current.set(g.id || g.custom_url, g);
                    invitationQueueRef.current.push(g);
                    maybeShowNextInvitation();
                }
                // Persist latest invited group info objects under single key 'inv'
                try {
                    const raw = localStorage.getItem('inv');
                    const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
                    const idKey = String(g.id ?? g.custom_url ?? '');
                    const next = (arr || []).filter((x) => String((x && (x.id ?? x.custom_url)) ?? '') !== idKey);
                    next.push(g);
                    localStorage.setItem('inv', JSON.stringify(next));
                } catch {}
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
    }, [token, user, maybeShowNextInvitation]);

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

    // On refresh: request invitations once per refresh (no sessionStorage persistence)
    useEffect(() => {
        if (!isAuthenticated || !token) return;
        // Guard against duplicate sends within the same mount/render cycle
        if (invitesRequestedRef.current) return;
        try {
            webSocketService.send({ type: 'get_and_clear_invitations', token });
            invitesRequestedRef.current = true;
        } catch {}
    }, [isAuthenticated, token]);

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
            setSearchError(null);
            webSocketService.send({ type: 'search_user', token, query });
        } else {
            setSearchResults([]);
            setSearchError(null);
        }
    }, [token]);

    const value = {
        contacts, searchResults, isLoading, error, searchError,
        getContacts, addContact, removeContact, searchUsers, setSearchResults
    };

    // Keep token accessible in invitation flow (for confirm handler)
    const authContextValueRef = useRef({ token });
    useEffect(() => { authContextValueRef.current = { token }; }, [token]);

    return (
        <ContactsContext.Provider value={value}>
            {children}
        </ContactsContext.Provider>
    );
};

export const useContacts = () => useContext(ContactsContext);
