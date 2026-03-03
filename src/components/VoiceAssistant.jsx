import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addItem } from '../slices/cartSlice';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Mic, MicOff, X, HelpCircle, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceAssistant = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [products, setProducts] = useState([]);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    // 1. Fetch Products on Mount
    useEffect(() => {
        if (isOpen) {
            const fetchProducts = async () => {
                try {
                    const snap = await getDocs(collection(db, "products"));
                    const productList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setProducts(productList);
                } catch (e) {
                    console.error("Voice Assistant: Failed to load products");
                }
            };

            fetchProducts();
            SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
        } else {
            SpeechRecognition.stopListening();
            resetTranscript();
        }
    }, [isOpen]);

    // --- HELPER: Execute Action ---
    const executeCommand = (action, toastMsg, shouldClose = false) => {
        action();
        if (toastMsg) {
            toast.success(toastMsg, { style: { background: '#1e293b', color: '#fff' } });
        }
        resetTranscript(); // Clear text immediately on success
        if (shouldClose) onClose();
    };

    // 2. LOGIC: Handle "Command Not Found" (Silence Timer)
    useEffect(() => {
        if (!transcript) return;

        const timer = setTimeout(() => {
            if (transcript.trim().length > 0) {
                toast.error("I didn't understand that command.", {
                    style: { background: '#1e293b', color: '#fff', border: '1px solid #ef4444' },
                    icon: '🤷‍♂️'
                });
                resetTranscript();
            }
        }, 2500);

        return () => clearTimeout(timer);
    }, [transcript, resetTranscript]);

    // 3. MANUAL COMMAND PROCESSING
    useEffect(() => {
        if (!transcript) return;

        const command = transcript.toLowerCase();

        // --- NAVIGATION COMMANDS ---
        if (command.includes('go to home') || command.includes('open home')) {
            executeCommand(() => navigate('/'), "Navigating Home...", true);
        }
        else if (command.includes('go to basket') || command.includes('open cart') || command.includes('view cart')) {
            executeCommand(() => navigate('/cart'), "Opening Cart...", true);
        }
        else if (command.includes('go to contact')) {
            executeCommand(() => navigate('/contact'), "Opening Contact Page...", true);
        }
        else if (command.includes('go to about')) {
            executeCommand(() => navigate('/about'), "Opening About Page...", true);
        }
        else if (command.includes('go to dashboard') || command.includes('open dashboard')) {
            executeCommand(() => navigate('/userdashboard'), "Opening Dashboard...", true);
        }
        else if (command.includes('login') || command.includes('sign in')) {
            executeCommand(() => navigate('/login'), "Opening Login...", true);
        }

        // --- SEARCH COMMANDS ---
        else if (command.includes('search for') || command.includes('find') || command.includes('show me')) {
            const keyword = command
                .replace('search for', '')
                .replace('find', '')
                .replace('show me', '')
                .trim();

            if (keyword.length > 2) {
                executeCommand(() => {
                    navigate(`/search?q=${keyword}`);
                }, `Searching for "${keyword}"...`, true);
            }
        }

        // --- ADD TO CART COMMANDS ---
        else if (command.includes('add') && command.includes('to basket')) {
            const itemToBuy = command.split('add')[1].split('to basket')[0].trim();
            handleAddToCart(itemToBuy);
        }
        else if (command.includes('buy')) {
            const itemToBuy = command.replace('buy', '').trim();
            handleAddToCart(itemToBuy);
        }

        // --- SYSTEM COMMANDS ---
        else if (command.includes('close') || command.includes('stop') || command.includes('exit')) {
            executeCommand(() => { }, "See you Again!", true);
        }

    }, [transcript, products, navigate, dispatch, onClose]);

    // Helper to find product and add to cart
    const handleAddToCart = (productName) => {
        if (!productName || products.length === 0) return;

        const product = products.find(p =>
            p.product_name.toLowerCase().includes(productName) ||
            p.product_category.toLowerCase().includes(productName)
        );

        if (product) {
            dispatch(addItem({
                product_id: product.product_id || product.id,
                product_name: product.product_name,
                selling_unit_price: Number(product.selling_unit_price),
                image_url: product.image_url,
                quantity: 1
            }));
            executeCommand(() => { }, `Added ${product.product_name} to Cart`, false);
        }
    };

    if (!browserSupportsSpeechRecognition) return null;
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative flex flex-col items-center text-center">

                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                {/* Mic Visualizer */}
                <div className={`p-6 rounded-full mb-6 transition-all duration-500 ${listening ? 'bg-blue-600/20 text-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.3)] scale-110' : 'bg-slate-800 text-slate-500'}`}>
                    {listening ? <Mic size={40} className="animate-pulse" /> : <MicOff size={40} />}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{listening ? 'Listening...' : 'Paused'}</h3>

                {/* Live Transcript Display */}
                <div className="h-20 flex items-center justify-center w-full px-4 mb-4">
                    <p className="text-slate-300 text-lg font-medium italic break-words">
                        {transcript ? `"${transcript}"` : "Say 'Go to Cart' or 'Search Jeans'..."}
                    </p>
                </div>

                {/* Suggestion Chips */}
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col items-center">
                        <HelpCircle size={16} className="text-slate-500 mb-1" />
                        <p className="text-xs text-blue-300 font-medium">"Go to Home"</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col items-center">
                        <HelpCircle size={16} className="text-slate-500 mb-1" />
                        <p className="text-xs text-emerald-300 font-medium">"Buy [Product Name]"</p>
                    </div>
                </div>

                {/* Manual Controls */}
                <div className="flex gap-3 w-full mt-6">
                    <button
                        onClick={SpeechRecognition.startListening}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                        Resume
                    </button>

                    {/* NEW STOP BUTTON */}
                    <button
                        onClick={onClose}
                        className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <StopCircle size={16} /> Stop
                    </button>

                    <button
                        onClick={resetTranscript}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistant;