import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation, Autoplay } from 'swiper/modules';
import HeroImage from "../../assets/hero.svg";
import moaaz from "../../assets/images/moaaz.jpg";

const people = [
  {
    name: 'Moaaz Atef Fouad',
    field: 'Front End Developer',
    img: moaaz,
  },
  {
    name: 'Islam Ahmed Hassan',
    field: 'Front End Developer',
    img: moaaz,
  },
  {
    name: 'Hamdy Emad Hamdy',
    field: 'Front End Developer',
    img: moaaz,
  },
  {
    name: 'Mario Atef Girgis',
    field: 'Front End Developer',
    img: moaaz,
  },
  {
    name: 'Hussein Mohsen El Gendy',
    field: 'Front End Developer',
    img: moaaz,
  },
  {
    name: 'Mohamed Mahmoud Farag',
    field: 'Front End Developer',
    img: moaaz,
  },
];

export default function Slider() {
  return <> <section className='relative min-h-screen w-full overflow-hidden'>
    <img
      src={HeroImage}
        alt="Hero background"
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
      />
   
<div className="max-w-7xl mx-auto py-24 overflow-hidden text-center mb-20 relative z-10">
      <h2 className="text-5xl font-bold leading-tight pb-4 bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 text-transparent bg-clip-text">
        Our Team Members<br />
        <span className="max-w-2xl mx-auto text-lg leading-relaxed text-gray-300 backdrop-blur-sm px-4">Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolores, dolorem!</span>
      </h2>

      <Swiper
        modules={[Autoplay]}
        navigation={false}
        loop={true}
        speed={800}
        autoplay={{
          delay: 900,
          disableOnInteraction: false,
          pauseOnMouseEnter: false, 
        }}
        spaceBetween={30}
        slidesPerView={3}
        className="mt-12"
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }}
        freeMode={true}
        grabCursor={true}
      >
        {people.map((person, index) => (
          <SwiperSlide key={index}>
          <div className="group relative bg-blue-500/10 rounded-xl p-4 transition-all duration-300 ">
        
            <img
              src={person.img}
              alt={person.name}
              className="rounded mx-auto mb-4 transition-transform duration-300 group-hover:scale-105"
            />
        
            <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-300">
              <p className="text-lg font-semibold text-center px-4">{person.name} - {person.field}</p>
            </div>
        
            <h3 className="text-xl bg-gradient-to-br from-white via-violet-400 to-white text-transparent bg-clip-text font-semibold text-center">
              {person.name}
            </h3>
            <p className="bg-gradient-to-br from-white via-orange-500 to-white text-transparent bg-clip-text text-sm text-center">{person.field}</p>
        
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-br from-transparent via-violet-700 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
          </div>
        </SwiperSlide>
        
        ))}
      </Swiper>
    </div>
  </section>
    
    </>
}
