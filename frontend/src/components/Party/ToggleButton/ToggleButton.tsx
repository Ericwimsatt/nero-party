import { useState } from 'react';
import { motion } from 'framer-motion';

export interface ToggleButtonProps {
  unpressedLabel?: string;
  pressedLabel?: string;
  defaultPressed?: boolean;
  onChange?: (pressed: boolean) => void;
  buttonColor?: string;
  shadowColor?: string;
  unpressedTextColor?: string;
  pressedTextColor?: string;
  width?: string | number;
}

export function ToggleButton({
  unpressedLabel = 'Vote',
  pressedLabel = 'Unvote',
  defaultPressed = false,
  onChange,
  buttonColor = '#21c33c',
  shadowColor = '#357e41',
  unpressedTextColor = '#ffffff',
  pressedTextColor = '#ffffff',
  width = '160px',
}: ToggleButtonProps) {
    if (pressedLabel === '') {
        pressedLabel = unpressedLabel;
    }
    const [pressed, setPressed] = useState(defaultPressed);

    const handleClick = () => {
        const next = !pressed;
        setPressed(next);
        onChange?.(next);
    };

    const raisedShadow = `-5px 5px 3px rgb(from ${shadowColor} r g b /.8`;
    const sunkenShadow = `5px -5px 3px rgb(from ${buttonColor} r g b /.3`;

    return (
        <motion.button
        className="border-none rounded-[5px] px-8 py-3 text-base cursor-pointer outline-none tracking-[0.06em] select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8888ff] focus-visible:outline-offset-[3px]"
        onClick={handleClick}
        animate={{
            boxShadow: pressed ? sunkenShadow : raisedShadow,
            backgroundColor: pressed ? shadowColor : buttonColor,
            y: pressed ? 2 : 0,
            fontWeight: pressed ? 400 : 600,
        }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        aria-pressed={pressed}
        style={{ color: pressed ? pressedTextColor : unpressedTextColor, width }}
        >
        {pressed ? pressedLabel : unpressedLabel}
        </motion.button>
    );
}
