#include <iostream>
#include "User.h"

int main() {
    User user;
    user.setId("12345");
    user.setEmail("user@example.com");
    user.setUsername("user123");
    user.setPasswordHash("hashed_password");

    Profile profile;
    profile.setFullName("Ali Reza");
    profile.setBio("Backend Developer");
    profile.setAvatarUrl("http://example.com/avatar.jpg");
    profile.setBirthDate("1990-01-01");

    user.setProfile(profile);
    user.setCustomUrl("user123-profile");

    std::cout << "User JSON:\n" << user.toJson() << std::endl;

    return 0;
}
