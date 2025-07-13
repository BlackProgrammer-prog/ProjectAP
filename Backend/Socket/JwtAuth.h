//
// Created by afraa on 6/2/2025.
//

#ifndef BACKEND_JWTAUTH_H
#define BACKEND_JWTAUTH_H

#include <string>
#include <map>
#include <memory>

class JwtAuth {
public:
    // سازنده با کلید مخفی (حداقل 32 کاراکتر)
    static std::shared_ptr<JwtAuth> create(const std::string& secret_key);

    // ایجاد توکن برای کاربر
    std::string createUserToken(const std::string& userId,
                                const std::string& role = "user",
                                int expiresInHours = 24);

    // بررسی اعتبار توکن
    bool isValidToken(const std::string& token);

    // دریافت شناسه کاربر از توکن
    std::string getUserId(const std::string& token);

    // دریافت نقش کاربر از توکن
    std::string getUserRole(const std::string& token);

    // دریافت تمام اطلاعات توکن (برای موارد پیشرفته)
    std::map<std::string, std::string> getAllClaims(const std::string& token);

    // غیرفعال کردن یک توکن (برای logout)
    void invalidateToken(const std::string& token);

    // تنظیمات پیشرفته (اختیاری)
    void setTokenExpiration(int hours);

private:
    JwtAuth(const std::string& secret_key);
    // پیاده سازی داخلی
    class Impl;
    std::unique_ptr<Impl> impl_;
};


#endif //BACKEND_JWTAUTH_H
