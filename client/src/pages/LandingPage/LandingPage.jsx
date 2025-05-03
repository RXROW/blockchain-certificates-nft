 import HowItWorks from '../../components/Landing/HowItWork'
import Hero from '../../components/Landing/Hero'
import React from 'react'
import Featers from '../../components/Landing/Featers'
import Team from '../../components/Landing/Team'
import Certificates from '../../components/Landing/Certificates'
import Footer from '../../components/Shared/Footer'

 
 const LandingPage = () => {
   return (
     <div className=" pt-20 text-white">
       <Hero />
       <HowItWorks />
       <Featers />
       <Certificates/>
       <Team />
      <Footer />
     </div>
   )
 }
 
 export default LandingPage