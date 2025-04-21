import React from "react";
import HeroImage from "../../assets/hero.svg";
const Featers = () => {
    const featerCards = [
        {
            title: "Immutable Certificates",
            description:
                "Every certificate is minted as an NFT on the Ethereum blockchain, ensuring it's tamper-proof, permanent, and publicly verifiable.",
            gradient: "from-blue-400 to-purple-400",
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-400",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>


            ),
        },
        {
            title: "Authentic Ownership",
            description:
                "Certificates are linked to your Ethereum wallet, ensuring undeniable proof of ownership and authenticity.",
            gradient: "from-green-400 to-emerald-400",
            bgColor: "bg-green-500/10",
            textColor: "text-green-400",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ),
        },
        {
            title: "Fraud Protection",
            description:
                "Built-in blockchain security ensures that certificates cannot be forged, copied, or tampered with by unauthorized users.",
            gradient: "from-red-400 to-pink-400",
            bgColor: "bg-red-500/10",
            textColor: "text-red-400",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
            ),
        },
        {
            title: "Global Verifiability",
            description:
                "Anyone can verify a certificate instantly through its blockchain record, making it shareable with employers, schools, and institutions globally.",
            gradient: "from-indigo-400 to-blue-600",
            bgColor: "bg-indigo-500/10",
            textColor: "text-indigo-400",
            icon: (
                <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
                </svg>


            ),
        },
    ];


    return (
        <section className="py-24   relative overflow-hidden">
            <img
                src={HeroImage}
                alt="Hero background"
                className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
            />

            <div className="max-w-4xl mx-auto text-center mb-20 relative z-10">
                <h2 className="text-5xl font-bold leading-tight pb-4 bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 text-transparent bg-clip-text">
                    Our Features
                </h2>
                <p className="max-w-2xl mx-auto text-lg leading-relaxed text-gray-300 backdrop-blur-sm px-4">
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Consequatur
                    nemo nostrum a aut porro quod!
                </p>
            </div>
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 relative">
                    {featerCards.map((card, index) => (
                        <div key={index} className="group relative  ">
                            <div className="relative p-8  ring-1 ring-gray-800/50 rounded-sm backdrop-blur-xl 
                            transition-all duration-300 hover:ring-purple-500/50 
                            hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`text-4xl font-bold bg-gradient-to-r ${card.gradient} text-transparent bg-clip-text`}>
                                        {card.title}
                                    </span>
                                    <div className={`w-12 h-12 rounded-full ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                        <div className={card.textColor}>
                                            {card.icon}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                                    {card.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </section>
    );
};

export default Featers;
