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
    using It = transform_width<
                  binary_from_base64<std::string::const_iterator>, 
                  8, 
                  6
               >;
    return std::vector<unsigned char>(
               It(encodedString.begin()), 
               It(encodedString.end())
           );
}