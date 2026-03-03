import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const VoiceAssistant = ({
    isOpen,
    onClose,
    isAdmin = false,
    isSuperAdmin = false,
}) => {
    const navigate = useNavigate();
    const recognitionRef = useRef(null);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");

    // 🔥 Initialize Speech Recognition
    useEffect(() => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            console.warn("Speech Recognition not supported");
            return;
        }

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const speech = event.results[0][0].transcript;
            setTranscript(speech);
            handleCommand(speech.toLowerCase());
        };

        recognitionRef.current = recognition;
    }, []);

    const startListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    // 🧠 Voice Commands Logic
    const handleCommand = (command) => {
        if (command.includes("go to home")) {
            navigate("/");
        }

        else if (command.includes("go to cart")) {
            navigate("/cart");
        }

        else if (command.includes("go to about")) {
            navigate("/about");
        }

        else if (command.includes("go to contact")) {
            navigate("/contact");
        }

        else if (command.includes("open dashboard")) {
            if (isSuperAdmin) navigate("/superadmindashboard");
            else if (isAdmin) navigate("/admindashboard");
            else navigate("/userdashboard");
        }

        else if (command.includes("financial")) {
            if (isAdmin && !isSuperAdmin) {
                navigate("/financial-insights");
            } else {
                toast.error("Access denied");
            }
        }

        else if (command.includes("search")) {
            const query = command.replace("search", "").trim();
            if (query) {
                navigate(`/search?q=${encodeURIComponent(query)}`);
            }
        }

        else {
            toast("Command not recognized");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center px-4"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 20 }}
                        transition={{ type: "spring", stiffness: 120 }}
                        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                stopListening();
                                onClose();
                            }}
                            className="absolute top-3 right-3 text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-white text-lg font-bold mb-4 text-center">
                            🎤 Voice Assistant
                        </h2>

                        {/* Mic Button */}
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={isListening ? stopListening : startListening}
                                className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                                        ? "bg-blue-600 animate-pulse shadow-lg shadow-blue-500/40"
                                        : "bg-slate-800 hover:bg-slate-700"
                                    }`}
                            >
                                <Mic size={30} className="text-white" />
                            </button>
                        </div>

                        {/* Transcript */}
                        <div className="bg-slate-800 rounded-lg p-4 min-h-[60px] text-center text-slate-300 text-sm">
                            {transcript
                                ? transcript
                                : isListening
                                    ? "Listening..."
                                    : "Click the mic and speak"}
                        </div>

                        {/* Help Text */}
                        <div className="mt-4 text-xs text-slate-500 text-center space-y-1">
                            <p>Try saying:</p>
                            <p>• Go to cart</p>
                            <p>• Open dashboard</p>
                            <p>• Search shoes</p>
                            {isAdmin && <p>• Open financial insights</p>}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VoiceAssistant;