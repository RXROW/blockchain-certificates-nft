import React from 'react';
import { Link } from 'react-router-dom';
import HeroImage from '../../assets/hero.svg';

const Hero = () => {
    return (
        <div className="bg-gradient-to-br   m-0 relative overflow-hidden" id='hero'>
            {/* Grid of small squares background */}
         
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src={HeroImage}
                    alt="Hero background"
                   
                />
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-1 opacity-10">
                    {Array.from({ length: 144 }).map((_, index) => (
                        <div
                            key={index}
                            className={`w-full h-full ring-1 ring-violet-100/40 ${index % 2 === 0
                                ? 'bg-violet-500/20'
                                : 'bg-violet-400/10'
                                } rounded-sm transition-all duration-300 hover:bg-violet-500/30`}
                        />
                    ))}
                </div>
            </div>

            <section className="relative py-8 sm:py-16 lg:pb-40">
                <div className="absolute bottom-0 right-0 overflow-hidden opacity-10">
                    <svg className="w-full h-auto lg:w-auto lg:mx-auto" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#4F46E5" d="M40.7,-68.5C55.3,-60.9,71.3,-53.8,79.7,-41.4C88.1,-29,88.9,-11.3,85.9,5.2C82.9,21.8,76.1,37.2,65.8,49.4C55.5,61.6,41.6,70.8,26.5,77.1C11.3,83.5,-5.2,87.1,-20.3,83.9C-35.4,80.7,-49.1,70.8,-61.5,58.8C-73.9,46.8,-85,32.7,-89.5,16.2C-94.1,-0.3,-92.2,-19.2,-84.8,-34.3C-77.4,-49.4,-64.5,-60.8,-49.8,-68.4C-35.1,-76,-17.5,-79.9,-1.4,-77.6C14.7,-75.4,29.4,-67.1,40.7,-68.5Z" transform="translate(100 100)" />
                    </svg>
                </div>
          
                <div className="relative px-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-y-4 lg:items-center lg:grid-cols-2 xl:grid-cols-2">
                        <div className="text-center xl:col-span-1 lg:text-left md:px-16 lg:px-0 xl:pr-20">
                            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-100 text-transparent bg-clip-text animate-gradient-x sm:text-5xl sm:leading-tight lg:leading-tight">
                                Create Verified Digital Certificates as NFTs
                            </h1>

                            <p className="mt-2 text-xl text-gray-300 sm:mt-6">
                                Securely issue, verify, and manage digital certificates on the blockchain. Perfect for educational institutions, professional organizations, and certification authorities.
                            </p>

                            <Link to={"/dashboard"} className="ES-btn inline-flex  mt-8 text-lg font-bold text-gray-100  sm:mt-10    " role="button">
                                Get Started
                           
                            </Link>

                            <div className="mt-8">
                                <div className="flex items-center justify-center lg:justify-start">
                                    <svg className="w-5 h-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                        />
                                    
                                    </svg>
                                    <svg className="w-5 h-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                        />
                                    </svg>
                                    <svg className="w-5 h-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                        />
                                    </svg>
                                    <svg className="w-5 h-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                        />
                                    </svg>
                                    <svg className="w-5 h-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                        />
                                    </svg>
                                </div>

                                <blockquote className="mt-6">
                                    <p className="text-lg font-bold text-white">Revolutionized our certification process!</p>
                                    <p className="mt-3 text-base leading-5 text-gray-300">
                                        The Certificate NFT platform has transformed how we issue and verify credentials. The blockchain verification provides unmatched security and authenticity that our students and partners trust completely.
                                    </p>
                                </blockquote>

                                <div className="flex items-center justify-center mt-3 lg:justify-start">
                                    <div className="flex-shrink-0 object-cover w-8 h-8 overflow-hidden rounded-full bg-violet-500 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="ml-2 text-base font-bold text-white">Dr. Sarah Johnson</p>
                                    <p className="ml-2 text-sm text-gray-400">Academic Director, Global University</p>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-1 mt-10 lg:mt-0">
                            <div className="relative mx-auto lg:mr-0 lg:ml-auto max-w-lg">
                                {/* Main certificate */}
                                <div className="bg-white p-6 rounded-lg shadow-xl rotate-3 transform hover:rotate-0 transition-all duration-300">
                                    <div className="border-4 border-violet-600 border-double p-4 rounded">
                                        <div className="text-center">
                                            <div className="flex justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mt-2">CERTIFICATE OF ACHIEVEMENT</h3>
                                            <p className="text-sm text-gray-600 mt-1">This certifies that</p>
                                            <p className="text-xl font-bold text-violet-600 mt-2">JANE WILSON</p>
                                            <p className="text-sm text-gray-600 mt-1">has successfully completed</p>
                                            <p className="text-lg font-bold text-gray-800 mt-2">Blockchain Development Masterclass</p>
                                            <div className="mt-4 text-xs text-gray-500">
                                                <p>Date Issued: April 10, 2025</p>
                                                <p>Certificate ID: 0x8f5e...93b4</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Verification badge overlay */}
                                <div className="absolute -bottom-6 -right-6 bg-violet-600 rounded-full p-4 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>

                                {/* Blockchain elements in background */}
                                <div className="absolute -top-4 -left-4 bg-gray-800 rounded p-2 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Hero;