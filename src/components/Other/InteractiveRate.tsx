import React, { useState } from "react";
import * as Icon from "@phosphor-icons/react/dist/ssr";

interface InteractiveRateProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    size?: number;
    readonly?: boolean;
}

const InteractiveRate: React.FC<InteractiveRateProps> = ({ 
    rating, 
    onRatingChange, 
    size = 20, 
    readonly = false 
}) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleStarClick = (starIndex: number) => {
        if (!readonly) {
            onRatingChange(starIndex + 1);
        }
    };

    const handleStarHover = (starIndex: number) => {
        if (!readonly) {
            setHoverRating(starIndex + 1);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverRating(0);
        }
    };

    return (
        <div 
            className="rate flex gap-1" 
            onMouseLeave={handleMouseLeave}
        >
            {[0, 1, 2, 3, 4].map((starIndex) => {
                const starValue = starIndex + 1;
                const isFilled = readonly 
                    ? starValue <= rating 
                    : starValue <= (hoverRating || rating);
                
                return (
                    <Icon.Star
                        key={starIndex}
                        size={size}
                        color={isFilled ? "#ECB018" : "#9FA09C"}
                        weight="fill"
                        className={`cursor-pointer transition-colors duration-200 ${
                            readonly ? '' : 'hover:scale-110'
                        }`}
                        onClick={() => handleStarClick(starIndex)}
                        onMouseEnter={() => handleStarHover(starIndex)}
                    />
                );
            })}
        </div>
    );
};

export default InteractiveRate;
