import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation, Autoplay } from 'swiper/modules';
import HeroImage from "../../assets/hero.svg";
import certImage from "../../assets/images/cert.jpg";

const certificates = [
  {
    id: "1",
    courseName: "Blockchain Development",
    institution: "Blockchain Academy",
    student: "John Doe",
    grade: "A+",
    completionDate: "2024-03-15",
    status: "Verified"
  },
  {
    id: "2",
    courseName: "Smart Contract Security",
    institution: "Crypto University",
    student: "Jane Smith",
    grade: "A",
    completionDate: "2024-03-10",
    status: "Verified"
  },
  {
    id: "3",
    courseName: "Web3 Development",
    institution: "Web3 Institute",
    student: "Alex Johnson",
    grade: "A-",
    completionDate: "2024-03-05",
    status: "Verified"
  },
  {
    id: "4",
    courseName: "DeFi Fundamentals",
    institution: "DeFi Academy",
    student: "Sarah Wilson",
    grade: "B+",
    completionDate: "2024-02-28",
    status: "Verified"
  },
  {
    id: "5",
    courseName: "NFT Development",
    institution: "NFT School",
    student: "Mike Brown",
    grade: "A",
    completionDate: "2024-02-20",
    status: "Verified"
  },
  {
    id: "6",
    courseName: "Cryptography Basics",
    institution: "Security Institute",
    student: "Emily Davis",
    grade: "A+",
    completionDate: "2024-02-15",
    status: "Verified"
  }
];

export default function Certificates() {
  return (
    <section className='relative min-h-screen w-full overflow-hidden'>
      <img
        src={HeroImage}
        alt="Hero background"
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
      />
   
      <div className="max-w-7xl mx-auto py-24 overflow-hidden text-center mb-20 relative z-10">
        <h2 className="text-5xl font-bold leading-tight pb-4 bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 text-transparent bg-clip-text">
          Certificates<br />
          <span className="max-w-2xl mx-auto text-lg leading-relaxed text-gray-300 backdrop-blur-sm px-4">
            View our latest verified certificates
          </span>
        </h2>

        <Swiper
          modules={[Autoplay]}
          navigation={false}
          loop={true}
          speed={800}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          spaceBetween={30}
          slidesPerView={3}
          className="mt-12"
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          freeMode={true}
          grabCursor={true}
        >
          {certificates.map((certificate) => (
            <SwiperSlide key={certificate.id}>
              <div className="group relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                {/* Certificate Image Container */}
                <div className="relative overflow-hidden rounded-lg mb-6 group-hover:shadow-lg transition-all duration-300">
                  <img
                    src={certImage}
                    alt={certificate.courseName}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="text-xl font-bold mb-1">{certificate.courseName}</h3>
                      <p className="text-sm opacity-90">{certificate.institution}</p>
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                  {certificate.status}
                </div>
                
                {/* Certificate Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span className="font-medium">Student</span>
                    <span>{certificate.student}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span className="font-medium">Grade</span>
                    <span className="text-green-400 font-semibold">{certificate.grade}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span className="font-medium">Completed</span>
                    <span>{certificate.completionDate}</span>
                  </div>
                </div>
                
                {/* Hover Effect Border */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
