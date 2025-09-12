// //
// // Created by afraa on 8/8/2025.
// //

// #include "FileManager.h"
// #include <fstream>
// #include <boost/archive/iterators/base64_from_binary.hpp>
// #include <boost/archive/iterators/binary_from_base64.hpp>
// #include <boost/archive/iterators/transform_width.hpp>
// #include <boost/uuid/uuid.hpp>
// #include <boost/uuid/uuid_generators.hpp>
// #include <boost/uuid/uuid_io.hpp>
// #include <filesystem>

// namespace fs = std::filesystem;
// using namespace boost::archive::iterators;

// std::vector<unsigned char> FileManager::base64Decode(const std::string& encodedString) {
//     using It = transform_width<binary_from_base64<std::string::const_iterator>, 8, 6>;
//     return std::vector<unsigned char>(It(encodedString.begin()), It(encodedString.end()));
// }

// std::string FileManager::saveBase64File(const std::string& base64Data, const std::string& directory, const std::string& preferredName) {
//     // Extract file extension from preferred name or default to .png
//     std::string extension = ".png";
//     if (auto pos = preferredName.rfind('.'); pos != std::string::npos) {
//         extension = preferredName.substr(pos);
//     }

//     // Generate a unique filename to avoid conflicts
//     boost::uuids::uuid uuid = boost::uuids::random_generator()();
//     std::string uniqueFilename = to_string(uuid) + extension;

//     // Resolve directory relative to project root (folder containing this source file)
//     fs::path projectRoot = fs::path(__FILE__).parent_path();
//     fs::path targetDir = fs::path(directory);
//     if (targetDir.is_relative()) {
//         targetDir = projectRoot / targetDir;
//     }

//     // Ensure directories exist
//     std::error_code dirEc;
//     fs::create_directories(targetDir, dirEc);

//     fs::path filePath = targetDir / uniqueFilename;

//     // Decode the Base64 data
//     // Remove "data:image/png;base64," prefix if it exists
//     std::string pureBase64 = base64Data;
//     if (auto pos = base64Data.find(','); pos != std::string::npos) {
//         pureBase64 = base64Data.substr(pos + 1);
//     }

//     std::vector<unsigned char> decodedData = base64Decode(pureBase64);

//     // Save the file
//     std::ofstream outFile(filePath, std::ios::binary);
//     if (!outFile.is_open()) {
//         return ""; // Return empty string on failure
//     }
//     outFile.write(reinterpret_cast<const char*>(decodedData.data()), decodedData.size());
//     outFile.close();

//     // Return the relative path to be stored in the DB and used by the client
//     return "uploads/avatars/" + uniqueFilename;
// }
// -------------------------------------------------------------------------------ali
#include "FileManager.h"
#include <fstream>
#include <boost/archive/iterators/base64_from_binary.hpp>
#include <boost/archive/iterators/binary_from_base64.hpp>
#include <boost/archive/iterators/transform_width.hpp>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <filesystem>
#include <string_view>
#include <iostream>

namespace fs = std::filesystem;
using namespace boost::archive::iterators;

namespace
{
    // تابع کمکی برای decode با چک خطا
    std::vector<unsigned char> safeBase64Decode(std::string_view encoded)
    {
        // حذف padding
        std::string clean(encoded);
        clean.erase(std::remove(clean.begin(), clean.end(), '\n'), clean.end());
        clean.erase(std::remove(clean.begin(), clean.end(), '\r'), clean.end());

        try
        {
            using It = transform_width<binary_from_base64<std::string::const_iterator>, 8, 6>;
            return {It(clean.begin()), It(clean.end())};
        }
        catch (...)
        {
            return {}; // در صورت خطا رشته خالی
        }
    }
}

std::string FileManager::saveBase64File(const std::string &base64Data,
                                        const std::string &directory,
                                        const std::string &preferredName)
{
    // استخراج پسوند
    std::string extension = ".png";
    if (auto pos = preferredName.rfind('.'); pos != std::string::npos)
    {
        extension = preferredName.substr(pos);
    }

    // تولید نام یکتا
    const auto uuid = boost::uuids::random_generator()();
    const std::string uniqueFilename = to_string(uuid) + extension;

    // مسیر پوشه
    fs::path targetDir = fs::path(directory);
    if (!fs::exists(targetDir))
    {
        std::error_code ec;
        if (!fs::create_directories(targetDir, ec) && ec)
        {
            std::cerr << "Failed to create directory: " << ec.message() << std::endl;
            return {};
        }
    }

    fs::path filePath = targetDir / uniqueFilename;

    // حذف prefix (مثلاً "data:image/png;base64,")
    std::string_view pureBase64 = base64Data;
    if (auto pos = base64Data.find(','); pos != std::string::npos)
    {
        pureBase64 = std::string_view(base64Data).substr(pos + 1);
    }

    // decode
    auto decodedData = safeBase64Decode(pureBase64);
    if (decodedData.empty())
    {
        std::cerr << "Base64 decode failed\n";
        return {};
    }

    // ذخیره فایل
    std::ofstream outFile(filePath, std::ios::binary);
    if (!outFile)
    {
        std::cerr << "Failed to open file for writing\n";
        return {};
    }
    outFile.write(reinterpret_cast<const char *>(decodedData.data()), static_cast<std::streamsize>(decodedData.size()));
    if (!outFile.good())
    {
        std::cerr << "Error while writing file\n";
        return {};
    }

    // مسیر نهایی برای ذخیره در دیتابیس
    return (fs::path("uploads/avatars") / uniqueFilename).string();
}
