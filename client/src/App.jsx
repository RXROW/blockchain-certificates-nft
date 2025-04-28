import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/Shared/LoadingSpinner';
import Navbar from './components/Shared/Navbar';
import LandingPage from './pages/LandingPage/LandingPage';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import CertificatesList from './pages/Dashboard/CertificatesList';
import IssueCertificate from './pages/Dashboard/IssueCertificate';
import VerifyCertificates from './pages/Dashboard/VerifyCertificates';
import CertificateUpdate from './pages/Dashboard/UpdateCertificate';
import ManageCourses from './pages/Dashboard/ManageCourses';
import ManageInstitutions from './pages/Dashboard/ManageInstitutions';
import Dashboard from './pages/Dashboard/Dashboard';
import Footer from './components/Shared/Footer';
import { Toaster } from 'react-hot-toast';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Loading from './components/Shared/LoadingSpinner';



function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [userAccount, setUserAccount] = useState(null);
    const [isInstitution, setIsInstitution] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Check if MetaMask is installed
                if (window.ethereum) {
                    // Request account access
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });

                    if (accounts && accounts.length > 0) {
                        setUserAccount(accounts[0]);
                        // TODO: Add logic to check if the account is an institution
                        // For now, we'll set it to true for testing
                        setIsInstitution(true);
                    }

                    // Listen for account changes
                    window.ethereum.on('accountsChanged', (accounts) => {
                        if (accounts.length > 0) {
                            setUserAccount(accounts[0]);
                            // TODO: Add logic to check if the new account is an institution
                            setIsInstitution(true);
                        } else {
                            setUserAccount(null);
                            setIsInstitution(false);
                        }
                    });
                }
            } catch (error) {
                console.error('Error initializing app:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();

        // Cleanup function
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => { });
            }
        };
    }, []);

    // Simple auth check function
    const isAuthenticated = !!userAccount;

    // Auth guard component
    const ProtectedRoute = ({ children }) => {
        if (!isAuthenticated) {
            return <Navigate to="/" />;
        }
        return children;
    };

    if (isLoading) {
        return (
            <div className="app-loading flex items-center justify-center h-screen bg-gray-100">
                <Loading variant="cube" />
            </div>
        );
    }

    return (
        <Router>
            <div className="App flex flex-col min-h-screen bg-slate-950">
                {/* Navbar shown on all pages */}
                <Navbar userAccount={userAccount} />

                {/* Main content area */}
                <div className="flex-grow">
                    <Routes>
                        {/* Public route */}
                        <Route path="/" element={<LandingPage />} />

                        {/* Dashboard routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            {/* Dashboard default route */}
                            <Route index element={<Navigate to="in" replace />} />

                            {/* Available to all users */}
                            <Route path="certificates" element={<CertificatesList />} />
                            <Route path="in" element={<Dashboard />} />

                            {/* Institution & admin routes */}
                            <Route path="issue" element={<IssueCertificate />} />
                            <Route path="verify" element={<VerifyCertificates />} />
                            <Route path="update" element={<CertificateUpdate />} />
                            <Route path="courses" element={<ManageCourses isInstitution={isInstitution} />} />
                            <Route path="institutions" element={<ManageInstitutions />} />

                            {/* Catch-all for dashboard */}
                            <Route path="*" element={<Navigate to="/dashboard/certificates" replace />} />
                        </Route>

                        {/* Global catch-all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>

                {/* Footer shown on all pages */}
                <Footer />
                <Toaster position="top-center" />
            </div>
        </Router>
    );
}

export default App;