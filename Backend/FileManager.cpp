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
  
    std::string extension = ".png";
    if (auto pos = preferredName.rfind('.'); pos != std::string::npos) {
        extension = preferredName.substr(pos);
    }
    
    boost::uuids::uuid uuid = boost::uuids::random_generator()();
    std::string uniqueFilename = to_string(uuid) + extension;

    fs::path projectRoot = fs::path(FILE).parent_path();
    fs::path targetDir = fs::path(directory);
    if (targetDir.is_relative()) {
        targetDir = projectRoot / targetDir;
    }

    std::error_code dirEc;
    fs::create_directories(targetDir, dirEc);

    fs::path filePath = targetDir / uniqueFilename;

    std::string pureBase64 = base64Data;
    if (auto pos = base64Data.find(','); pos != std::string::npos) {
        pureBase64 = base64Data.substr(pos + 1);
    }
    
    std::vector<unsigned char> decodedData = base64Decode(pureBase64);

    std::ofstream outFile(filePath, std::ios::binary);
    if (!outFile.is_open()) {
        return "";
    }
    outFile.write(reinterpret_cast<const char*>(decodedData.data()), decodedData.size());
    outFile.close();

    return "uploads/avatars/" + uniqueFilename;
}