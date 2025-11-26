
import React from 'react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

const WhatsAppButton: React.FC = () => {
    const phoneNumber = '5513996104848';
    
    return (
        <a 
            href={`https://wa.me/${phoneNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:bg-[#128C7E] transition-all duration-300 hover:scale-110 flex items-center justify-center"
            title="Fale conosco no WhatsApp"
        >
            <WhatsAppIcon className="h-8 w-8" />
        </a>
    );
};

export default WhatsAppButton;
