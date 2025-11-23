"use client";
import React from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import IBanner from "../../../public/banner.webp";

// Import Swiper styles
import "swiper/css";
import "./banner.css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Image from "next/image";

const imageStyle = {
  border: "1px solid #fff",
  width: "100%",
  height: "auto",
};

export const Banner = () => {
  return (
    <div className="relative w-full h-[200px] sm:h-[400px] md:h-[500px] lg:h-[500px] overflow-hidden">
      {/* Botones de navegación */}
      <button className="button-prev cursor-pointer bg-primary rounded-full w-10 h-10 text-3xl text-white absolute left-2 top-1/2 -translate-y-1/2 z-10">
        ←
      </button>
      <button className="button-next cursor-pointer bg-primary rounded-full w-10 h-10 text-3xl text-white absolute right-2 top-1/2 -translate-y-1/2 z-10">
        →
      </button>

      {/* Swiper */}
      <Swiper
        // install Swiper modules
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        spaceBetween={50}
        slidesPerView={1}
        navigation={{
          nextEl: ".button-next",
          prevEl: ".button-prev",
        }}
        pagination={{ clickable: true }}
        scrollbar={{ draggable: true }}
        onSlideChange={() => {}}
        loop={true}
      >
        <SwiperSlide>
          <Image src={IBanner} style={imageStyle} alt="" priority={true} />
        </SwiperSlide>
        <SwiperSlide>
          <Image
            src={IBanner}
            style={imageStyle}
            alt=""
            priority={true}
            className="object-cover"
          />
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default Banner;
