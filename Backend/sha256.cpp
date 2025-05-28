#include "sha256.h"
#include "picosha2.h"

using namespace std;

string sha256(const string& input) {
    return picosha2::hash256_hex_string(input);
}