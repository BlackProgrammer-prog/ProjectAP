//
// Created by TUF_Fx507VV on 12/8/2025.
//

#ifndef BACKEND_FILEMANAGER_H
#define BACKEND_FILEMANAGER_H

#include <string>
#include <vector>

// Handles Base64 decoding and file saving
class FileManager {
public:
    // Save a Base64-encoded file and return its relative path
    static std::string saveBase64File(const std::string& base64Data,
                                      const std::string& directory,
                                      const std::string& preferredName);

private:
    // Decode Base64 string into binary data
    static std::vector<unsigned char> base64Decode(const std::string& encodedString);
};

#endif // BACKEND_FILEMANAGER_H