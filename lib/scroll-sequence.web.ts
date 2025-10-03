import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollSequenceOptions {
  baseUrl: string;
  count: number;
  from?: number;
  to?: number;
  pad?: number;
  enabled?: boolean;
  mobileDisable?: boolean;
}

export const useScrollSequence = (options: ScrollSequenceOptions) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    baseUrl,
    count,
    from = 0,
    to = count - 1,
    pad = 3,
    enabled = true,
    mobileDisable = true
  } = options;

  useEffect(() => {
    if (!enabled) return;
    if (mobileDisable && window.innerWidth < 768) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const frameCount = to - from + 1;
    const images: HTMLImageElement[] = [];
    const imageSeq = { frame: from };

    for (let i = from; i <= to; i++) {
      const img = new Image();
      const paddedNum = String(i).padStart(pad, '0');
      img.src = `${baseUrl}${paddedNum}.jpg`;
      images.push(img);
    }

    const render = () => {
      const index = Math.floor(imageSeq.frame) - from;
      if (images[index] && images[index].complete) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        const img = images[index];
        const scale = Math.max(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        context.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
    };

    images[0].onload = render;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: canvas,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: true
      }
    });

    tl.to(imageSeq, {
      frame: to,
      snap: 'frame',
      ease: 'none',
      onUpdate: render
    });

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [baseUrl, count, from, to, pad, enabled, mobileDisable]);

  return canvasRef;
};
