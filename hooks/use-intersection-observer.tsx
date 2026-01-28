import React, { useEffect, useRef, useState } from 'react'

const useIntersectionObserver = <T extends HTMLElement = HTMLDivElement>(threshold = 0.1) : [React.RefObject<T | null>, boolean] => {

    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold });
        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);


    return [ref, isVisible];
}

export default useIntersectionObserver;
