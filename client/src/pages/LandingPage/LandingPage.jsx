 import HowItWorks from '../../components/Landing/HowItWork'
import Hero from '../../components/Landing/Hero'
import React from 'react'
import Featers from '../../components/Landing/Featers'
import Team from '../../components/Landing/Team'
 
 const LandingPage = () => {
   return (
     <div className=" py-20 text-white">
       <Hero />
       <HowItWorks />
       <Featers />
       <Team/>
     </div>
   )
 }
 
 export default LandingPage