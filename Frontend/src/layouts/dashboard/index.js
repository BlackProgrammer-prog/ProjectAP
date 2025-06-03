import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme } from "@mui/material";
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import logo from "../../assets/Images/logo.ico"
import { Nav_Buttons } from "../../data/index";
import { Gear } from "phosphor-react";
import { faker } from "@faker-js/faker";
import useSettings from '../../hooks/useSettings'


const DashboardLayout = () => {
  const them = useTheme();
  const { onToggleMode } = useSettings()
  const [select, setSelect] = useState(null); // تغییر داده‌ام تا ابتدا هیچ دکمه‌ای انتخاب نشود

  const handleClick = (index) => {
    setSelect(index); // با کلیک دکمه انتخاب می‌شود
  };

  return (
    <Stack >
      <Box sx={{
        backgroundColor: them.palette.background.paper,
        boxShadow: "0px 0px 2px rgba(0,0,0,0.2)",
        height: "100vh",
        width: 100,
        paddingTop: 1

      }}>
        <Stack direction="column" alignItems={"center"} sx={{ width: "100%", height: "100%", flexDirection: "column", justifyContent: "space-between" }} >
          <Box sx={{
            backgroundColor: them.palette.primary.main,
            height: 64,
            width: 64,
            borderRadius: 12,
          }}>
            <img src={logo} alt="chat logo" />
          </Box>

          <Stack sx={{ width: "max-content", marginTop: 1 }} direction="column" spacing={2.5}>
            {Nav_Buttons.map((el) => (
              <Box
                key={el.index}
                sx={{
                  backgroundColor: select === el.index ? them.palette.primary.main : 'transparent',
                  borderRadius: 1.5
                }}
              >
                <IconButton
                  onClick={() => handleClick(el.index)}
                  sx={{
                    width: "max-content",
                    color: select === el.index ? "#fff" : "#000" // تغییر رنگ بر اساس انتخاب
                  }}
                >
                  {el.icon}
                </IconButton>
              </Box>
            ))}
            <Divider />
            {/* دکمه Gear */}
            <IconButton
              onClick={() => handleClick('gear')} // یک شناسه خاص برای Gear تنظیم کردیم
              sx={{
                color: select === 'gear' ? "#fff" : "#000", // تغییر رنگ برای Gear
                backgroundColor: select === 'gear' ? them.palette.primary.main : 'transparent',
                borderRadius: 1.5
              }}
            >
              <Gear />
            </IconButton>
          </Stack>

          {/* جایگذاری Switch بالاتر از Avatar */}
          <Box sx={{ marginTop: 'auto', marginBottom: 2 }}>
            <Switch onChange={() => {
              return (
                onToggleMode()
              )
            }} defaultChecked />
          </Box>

          {/* Avatar در پایین‌تر از Switch */}
          <Box sx={{ marginBottom: 2 }}>
            <Avatar src={faker.image.avatar()} />
          </Box>
        </Stack>
      </Box>
      <Outlet />
    </Stack>
  );
};

export default DashboardLayout;
