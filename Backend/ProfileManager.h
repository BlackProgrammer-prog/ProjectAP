
#ifndef DS_STORE_PROFILEMANAGER_H
#define DS_STORE_PROFILEMANAGER_H


class ProfileManager {
public:
    ProfileManager();
    void loadProfile(const std::string& email);
    void saveProfile();
    void clearProfile();
private:
    std::string userEmail;
};


#endif //DS_STORE_PROFILEMANAGER_H
