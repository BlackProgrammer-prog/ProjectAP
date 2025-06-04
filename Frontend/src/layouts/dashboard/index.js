import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme } from "@mui/material";
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import logo from "../../assets/Images/logo.ico"
import { Nav_Buttons } from "../../data/index";
import { Gear } from "phosphor-react";
import { faker } from "@faker-js/faker";
import useSettings from '../../hooks/useSettings'
import SideBar from "./SideBar";


const DashboardLayout = () => {

  return (
    <Stack>
      <SideBar />
    </Stack>
  );
};

export default DashboardLayout;
