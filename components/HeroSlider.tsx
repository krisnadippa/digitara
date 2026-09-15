"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";

interface SlideItem {
  id: number;
  tag: string;
  title: string;
  badge: string;
  buttonText: string;
  image: string;
  alt: string;
}

const baseSlides: SlideItem[] = [
  {
    id: 1,
    tag: "01 / All-in-One Digital",
    title: "Ekosistem AI & Akun Premium Terlengkap",
    badge: "Aktivasi Mudah • Akses Instan • 24/7 Bantuan",
    buttonText: "Lihat Semua",
    image: "/images/assetall.png",
    alt: "Koleksi Lengkap Akun AI dan Edukasi Premium",
  },
  {
    id: 2,
    tag: "02 / Google Gemini Advanced",
    title: "Kreativitas & Analisa Multimodal Generasi Baru",
    badge: "Model 1.5 Pro • Aktivasi Mudah • 18 Bulan",
    buttonText: "Beli Gemini",
    image: "/images/assetgemini.png",
    alt: "Google Gemini Advanced Akun Premium",
  },
  {
    id: 3,
    tag: "03 / OpenAI ChatGPT Plus",
    title: "Produktivitas Maksimal Bersama Model GPT-4o",
    badge: "Model GPT-4o • Aktivasi Mudah • 1 Bulan",
    buttonText: "Beli ChatGPT",
    image: "/images/assetchatgpt.png",
    alt: "ChatGPT Plus GPT-4o Akun Premium",
  },
  {
    id: 4,
    tag: "04 / Duolingo Super",
    title: "Kuasai Bahasa Asing Lebih Cepat Tanpa Iklan",
    badge: "Nyawa Unlimited • Aktivasi Mudah • 1 Tahun",
    buttonText: "Beli Duolingo",
    image: "/images/assetduo.png",
    alt: "Duolingo Super Akun Premium",
  },
];

// Multi-set buffering for seamless infinite looping
const extendedSlides: (SlideItem & { uniqueKey: string })[] = [
  ...baseSlides.map((s, idx) => ({ ...s, uniqueKey: `set1-${idx}` })),
  ...baseSlides.map((s, idx) => ({ ...s, uniqueKey: `set2-${idx}` })),
  ...baseSlides.map((s, idx) => ({ ...s, uniqueKey: `set3-${idx}` })),
];

export default function HeroSlider() {
  const numBaseSlides = baseSlides.length; // 4
  // Start cleanly at index 0 so assetall.png is 100% visible on first page load
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const currentDragDelta = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(0);
  const hasShiftedForPrev = useRef<boolean>(false);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Helper to measure container width safely with responsive gap
  const getContainerMetrics = () => {
    if (!containerRef.current) return { width: 1200, gap: 24 };
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : containerRef.current.offsetWidth || 1200;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const gap = isMobile ? 16 : 24;
    return { width, gap };
  };

  // Buttery Super-Smooth GSAP Infinite Transition
  const animateToSlide = useCallback(
    (targetIndex: number) => {
      if (!trackRef.current) return;
      const { width, gap } = getContainerMetrics();
      const slideOffset = (width + gap) * targetIndex;

      // Super smooth luxury ease curve
      gsap.to(trackRef.current, {
        x: -slideOffset,
        duration: 1.15,
        ease: "power3.out",
        overwrite: "auto",
        onComplete: () => {
          if (!trackRef.current) return;

          // Seamless loop teleportation
          if (targetIndex >= numBaseSlides) {
            // When reaching or passing set 2 slide 0 (index 4), seamlessly reset to index 0
            const normalizedIndex = targetIndex % numBaseSlides;
            const normalizedOffset = (width + gap) * normalizedIndex;
            gsap.set(trackRef.current, { x: -normalizedOffset });
            currentIndexRef.current = normalizedIndex;
            setCurrentIndex(normalizedIndex);
          } else if (targetIndex < 0) {
            // When moving backwards before 0, snap to set 2 equivalent
            const normalizedIndex = (targetIndex + numBaseSlides * 2) % numBaseSlides;
            const normalizedOffset = (width + gap) * normalizedIndex;
            gsap.set(trackRef.current, { x: -normalizedOffset });
            currentIndexRef.current = normalizedIndex;
            setCurrentIndex(normalizedIndex);
          }
        },
      });

      setCurrentIndex(targetIndex);
    },
    [numBaseSlides]
  );

  const goToNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    animateToSlide(nextIndex);
  }, [animateToSlide]);

  const goToPrev = useCallback(() => {
    if (currentIndexRef.current === 0) {
      // Instantly swap to index 4 (identical to 0) and animate to 3
      if (trackRef.current) {
        const { width, gap } = getContainerMetrics();
        gsap.set(trackRef.current, { x: -(width + gap) * numBaseSlides });
      }
      currentIndexRef.current = numBaseSlides;
      animateToSlide(numBaseSlides - 1);
    } else {
      animateToSlide(currentIndexRef.current - 1);
    }
  }, [animateToSlide, numBaseSlides]);

  // Autoplay functionality (6s interval)
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext]);

  // Active slide index for text (0, 1, 2, 3)
  const activeBaseIndex = ((currentIndex % numBaseSlides) + numBaseSlides) % numBaseSlides;
  const activeSlide = baseSlides[activeBaseIndex];

  // GSAP Fade Up Animation for the bottom text when active slide changes
  useEffect(() => {
    if (!textContainerRef.current) return;
    const animElements = textContainerRef.current.querySelectorAll(".anim-fade-up");

    gsap.fromTo(
      animElements,
      {
        opacity: 0,
        y: 18,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.07,
        overwrite: "auto",
      }
    );
  }, [activeBaseIndex]);

  // Window resize handler to maintain exact track position
  useEffect(() => {
    const handleResize = () => {
      if (!trackRef.current) return;
      const { width, gap } = getContainerMetrics();
      gsap.set(trackRef.current, {
        x: -(width + gap) * currentIndexRef.current,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Touch and Mouse Drag Handlers
  const onDragStart = (clientX: number) => {
    setIsAutoPlaying(false);
    isDragging.current = true;
    touchStartX.current = clientX;
    currentDragDelta.current = 0;
    hasShiftedForPrev.current = false;
  };

  const onDragMove = (clientX: number) => {
    if (!isDragging.current || touchStartX.current === null || !trackRef.current) return;
    const deltaX = clientX - touchStartX.current;
    currentDragDelta.current = deltaX;

    const { width, gap } = getContainerMetrics();

    // If dragging right at index 0, invisibly swap to index 4 so user can drag into slide 3
    if (currentIndexRef.current === 0 && deltaX > 0 && !hasShiftedForPrev.current) {
      hasShiftedForPrev.current = true;
      currentIndexRef.current = numBaseSlides;
    }

    const baseOffset = -(width + gap) * currentIndexRef.current;
    gsap.set(trackRef.current, {
      x: baseOffset + deltaX,
    });
  };

  const onDragEnd = () => {
    if (!isDragging.current || touchStartX.current === null) return;
    isDragging.current = false;
    touchStartX.current = null;

    const threshold = 55;
    const delta = currentDragDelta.current;
    currentDragDelta.current = 0;

    if (delta < -threshold) {
      goToNext();
    } else if (delta > threshold) {
      goToPrev();
    } else {
      animateToSlide(currentIndexRef.current);
    }

    setIsAutoPlaying(true);
  };

  return (
    <section className="w-full py-2 sm:py-6">
      {/* Full width container with safe margins */}
      <div className="w-full max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10">
        {/* 1. Viewport for the seamless rolling images */}
        <div
          ref={containerRef}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => {
            if (isDragging.current) onDragEnd();
            setIsAutoPlaying(true);
          }}
          onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
          onTouchEnd={onDragEnd}
          onMouseDown={(e) => onDragStart(e.clientX)}
          onMouseMove={(e) => onDragMove(e.clientX)}
          onMouseUp={onDragEnd}
          className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing py-0.5 sm:py-1"
        >
          {/* GSAP Moving Image Track - starts at x:0 immediately with no SSR delay */}
          <div
            ref={trackRef}
            className="flex gap-4 sm:gap-6 will-change-transform"
            style={{ transform: "translate3d(0px, 0px, 0px)" }}
          >
            {extendedSlides.map((slide, index) => (
              <div
                key={slide.uniqueKey}
                className="w-full flex-shrink-0"
              >
                {/* Pure HD Image Frame with exact native 821x304 ratio (clean transparent background, zero gray) */}
                <div className="relative w-full aspect-[821/304] rounded-2xl sm:rounded-[2.25rem] lg:rounded-[2.75rem] overflow-hidden bg-transparent border border-neutral-100 shadow-xs sm:shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    // Preload first slide immediately so it displays on page open with zero delay
                    priority={index === 0 || index === numBaseSlides}
                    sizes="(max-width: 640px) 100vw, (max-width: 1680px) 95vw, 1680px"
                    className="object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.015]"
                    draggable={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Stationary Balanced Explanation Bar (Does not scroll with images, fades in smoothly from bottom) */}
        <div
          ref={textContainerRef}
          className="w-full mt-2.5 sm:mt-4 px-1 sm:px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 sm:gap-4"
        >
          {/* Left Side: Tag & Bold Title */}
          <div className="flex flex-col items-start text-left w-full md:max-w-xl">
            <span className="anim-fade-up text-[10px] sm:text-xs font-semibold tracking-wider text-neutral-500 uppercase mb-0.5">
              {activeSlide.tag}
            </span>
            <h2 className="anim-fade-up text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-neutral-900 leading-snug">
              {activeSlide.title}
            </h2>
          </div>

          {/* Right Side: Subtle Highlight Badge & Clean Action Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 w-full md:w-auto mt-1 sm:mt-0">
            {/* Highlight Value Badge */}
            <span className="anim-fade-up text-[11px] sm:text-xs font-medium text-neutral-600 bg-neutral-100/90 px-3 py-1.5 rounded-full border border-neutral-200/60 truncate max-w-[210px] sm:max-w-none">
              {activeSlide.badge}
            </span>

            {/* Action CTA Button */}
            <button
              onClick={() => {
                alert(`Membuka produk: ${activeSlide.title}...`);
              }}
              className="anim-fade-up shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-neutral-900 text-white font-medium text-xs sm:text-sm hover:bg-neutral-800 active:scale-95 transition-all duration-200 shadow-sm group/btn"
            >
              <span>{activeSlide.buttonText}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
