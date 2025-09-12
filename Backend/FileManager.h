
// //
// // Created by afraa on 8/8/2025.
// //

 #ifndef BACKEND_FILEMANAGER_H
 #define BACKEND_FILEMANAGER_H

 #include <string>
 #include <vector>

 class FileManager {
 public:
     static std::string saveBase64File(const std::string& base64Data, const std::string& directory, const std::string& preferredName);

 private:
     static std::vector<unsigned char> base64Decode(const std::string& encodedString);
 };

 #endif //BACKEND_FILEMANAGER_H
// -------------------------------------------------------ali
//
// Created by afraa on 8/8/2025.
//
//
//#ifndef BACKEND_FILEMANAGER_H
//#define BACKEND_FILEMANAGER_H
//
//#include <string>
//#include <vector>
//#include <cstdint>
//#include <string_view>
//
//class FileManager
//{
//public:
//    [[nodiscard]] static std::string saveBase64File(std::string_view base64Data,
//                                                    std::string_view directory,
//                                                    std::string_view preferredName);
//
//private:
//    static std::vector<std::uint8_t> base64Decode(std::string_view encodedString);
//};
//
//#endif // BACKEND_FILEMANAGER_H
