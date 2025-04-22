import React from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from '../Shared/Sidebar';

const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-gray-950 mt-7">
         

            <div className="flex">
                <div className="flex-none ">
                    <Sidebar />
                </div>
                <div className="flex-grow p-6 transition-all duration-300">
                    <div className="  rounded-lg shadow-md p-6">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;