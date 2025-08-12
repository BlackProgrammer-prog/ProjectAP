//
// Created by TUF_Fx507VV on 12/8/2025.
//

#include "FileManager.h"
#include <fstream>
#include <boost/archive/iterators/base64_from_binary.hpp>
#include <boost/archive/iterators/binary_from_base64.hpp>
#include <boost/archive/iterators/transform_width.hpp>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <filesystem>

namespace fs = std::filesystem;
using namespace boost::archive::iterators;

std::vector<unsigned char> FileManager::base64Decode(const std::string& encodedString) {
    using It = transform_width<binary_from_base64<std::string::const_iterator>, 8, 6>;
    return std::vector<unsigned char>(It(encodedString.begin()), It(encodedString.end()));
}

std::string FileManager::saveBase64File(const std::string& base64Data, const std::string& directory, const std::string& preferredName) {
    // Extract file extension from preferred name or default to .png
    std::string extension = ".png";
    if (auto pos = preferredName.rfind('.'); pos != std::string::npos) {
        extension = preferredName.substr(pos);
    }
    
    // Generate a unique filename to avoid conflicts
    boost::uuids::uuid uuid = boost::uuids::random_generator()();
    std::string uniqueFilename = to_string(uuid) + extension;

    // Resolve directory relative to project root (folder containing this source file)
    fs::path projectRoot = fs::path(FILE).parent_path();
    fs::path targetDir = fs::path(directory);
    if (targetDir.is_relative()) {
        targetDir = projectRoot / targetDir;
    }

    // Ensure directories exist
    std::error_code dirEc;
    fs::create_directories(targetDir, dirEc);

    fs::path filePath = targetDir / uniqueFilename;

    // Decode the Base64 data
    // Remove "data:image/png;base64," prefix if it exists
    std::string pureBase64 = base64Data;
    if (auto pos = base64Data.find(','); pos != std::string::npos) {
        pureBase64 = base64Data.substr(pos + 1);
    }
    
    std::vector<unsigned char> decodedData = base64Decode(pureBase64);

    // Save the file
    std::ofstream outFile(filePath, std::ios::binary);
    if (!outFile.is_open()) {
        return ""; // Return empty string on failure
    }
    outFile.write(reinterpret_cast<const char*>(decodedData.data()), decodedData.size());
    outFile.close();

    // Return the relative path to be stored in the DB and used by the client
    return "uploads/avatars/" + uniqueFilename;
}