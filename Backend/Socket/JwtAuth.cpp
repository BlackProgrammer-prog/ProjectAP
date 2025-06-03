//
// Created by afraa on 6/2/2025.
//

#include "JwtAuth.h"
#include <jwt.h>
#include <stdexcept>
#include <unordered_set>

class JwtAuth::Impl {
public:
    Impl(const std::string& secret_key) : secret_key_(secret_key), token_expiration_hours_(24) {}

    std::string createToken(const std::string& userId, const std::string& role, int expiresInHours) {
        auto token = jwt::create()
                .set_issuer("app-server")
                .set_type("JWS")
                .set_issued_at(std::chrono::system_clock::now())
                .set_expires_at(std::chrono::system_clock::now() + std::chrono::hours{expiresInHours})
                .set_payload_claim("user_id", jwt::claim(userId))
                .set_payload_claim("role", jwt::claim(role));

        return token.sign(jwt::algorithm::hs256{secret_key_});
    }

    bool verifyToken(const std::string& token) {
        if (invalidated_tokens_.count(token) > 0) {
            return false;
        }

        try {
            auto decoded = jwt::decode(token);
            jwt::verify()
                    .allow_algorithm(jwt::algorithm::hs256{secret_key_})
                    .with_issuer("app-server")
                    .verify(decoded);
            return true;
        } catch (...) {
            return false;
        }
    }

    std::string getClaim(const std::string& token, const std::string& claim) {
        auto decoded = jwt::decode(token);
        return decoded.get_payload_claim(claim).as_string();
    }

    void invalidateToken(const std::string& token) {
        invalidated_tokens_.insert(token);
    }

    void setTokenExpiration(int hours) {
        token_expiration_hours_ = hours;
    }

private:
    std::string secret_key_;
    int token_expiration_hours_;
    std::unordered_set<std::string> invalidated_tokens_;
};

// Implementations of JwtAuth
std::shared_ptr<JwtAuth> JwtAuth::create(const std::string& secret_key) {
    return std::shared_ptr<JwtAuth>(new JwtAuth(secret_key));
}

JwtAuth::JwtAuth(const std::string& secret_key) :
        impl_(std::make_unique<Impl>(secret_key)) {}

std::string JwtAuth::createUserToken(const std::string& userId,
                                           const std::string& role,
                                           int expiresInHours) {
    return impl_->createToken(userId, role, expiresInHours);
}

bool JwtAuth::isValidToken(const std::string& token) {
    return impl_->verifyToken(token);
}

std::string JwtAuth::getUserId(const std::string& token) {
    return impl_->getClaim(token, "user_id");
}

std::string JwtAuth::getUserRole(const std::string& token) {
    return impl_->getClaim(token, "role");
}

std::map<std::string, std::string> JwtAuth::getAllClaims(const std::string& token) {
    auto decoded = jwt::decode(token);
    std::map<std::string, std::string> claims;

    for (const auto& [key, value] : decoded.get_payload_claims()) {
        claims[key] = value.as_string();
    }

    return claims;
}

void JwtAuth::invalidateToken(const std::string& token) {
    impl_->invalidateToken(token);
}

void JwtAuth::setTokenExpiration(int hours) {
    impl_->setTokenExpiration(hours);
}