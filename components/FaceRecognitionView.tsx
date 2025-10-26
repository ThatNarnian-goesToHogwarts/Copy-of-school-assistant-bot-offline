
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LoadingIcon, UploadIcon } from './Icons';

// Utility to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

interface FaceRecognitionViewProps {
  isOnline: boolean;
}

const FaceRecognitionView: React.FC<FaceRecognitionViewProps> = ({ isOnline }) => {
  const [image, setImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      // Wait for faceapi to be available on the window object
      if (!(window as any).faceapi) {
          setTimeout(loadModels, 100);
          return;
      }
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
      try {
        await Promise.all([
            (window as any).faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            (window as any).faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            (window as any).faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            (window as any).faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load face-api models:', error);
        setError('Could not load local analysis models. Offline analysis is unavailable.');
      }
    };
    loadModels();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for inline data
        setError('Image size should be less than 4MB.');
        return;
      }
      try {
        setError(null);
        setDescription('');
        setImageMimeType(file.type);
        const base64Image = await fileToBase64(file);
        setImage(base64Image);
      } catch (err) {
        setError('Failed to load image. Please try again.');
        console.error(err);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!image || !imageMimeType) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDescription('');

    if (isOnline) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              {
                inlineData: { data: image, mimeType: imageMimeType, },
              },
              {
                text: 'You are an expert at analyzing human faces. Describe the person in this image. Focus on their facial features, estimated age, and any emotions they might be expressing. Be respectful and objective.',
              },
            ],
          },
        });

        if (response.text && response.text.trim().length > 0) {
          setDescription(response.text);
        } else {
          setError("The model could not provide a description for this image. Please try a different one.");
        }
      } catch (err) {
        console.error(err);
        setError('Failed to analyze the image. This could be due to a network issue or a problem with the image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else { // Offline Logic
        if (!modelsLoaded) {
            setError('Offline analysis models are not loaded. Please connect to the internet to download them, then try again.');
            setIsLoading(false);
            return;
        }

        const img = new Image();
        img.src = `data:${imageMimeType};base64,${image}`;
        img.onload = async () => {
            try {
                const detection = await (window as any).faceapi
                    .detectSingleFace(img, new (window as any).faceapi.TinyFaceDetectorOptions())
                    .withFaceExpressions()
                    .withAgeAndGender();

                if (detection) {
                    const { age, gender, expressions } = detection;
                    const primaryExpression = Object.entries(expressions).reduce((acc: any, [key, value]: any) => value > acc.value ? { key, value } : acc, { key: '', value: 0 });
                    
                    const formattedDescription = `**Offline Analysis Results:**
- **Estimated Age:** ${Math.round(age)}
- **Estimated Gender:** ${gender}
- **Detected Emotion:** ${primaryExpression.key} (${Math.round(primaryExpression.value * 100)}% confidence)

*Note: This is a basic analysis performed on your device. For a more detailed description, please connect to the internet.*`;
                    setDescription(formattedDescription);
                } else {
                    setError("Could not detect a face in the image using the offline model.");
                }
            } catch (err) {
                console.error('Offline analysis error:', err);
                setError('An error occurred during local image analysis.');
            } finally {
                setIsLoading(false);
            }
        };
        img.onerror = () => {
            setError('Could not process the image for local analysis.');
            setIsLoading(false);
        };
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl w-full h-full flex flex-col animate-fade-in relative">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-300">
        Face Analysis { !isOnline && <span className="text-sm font-normal text-yellow-400">(Offline Mode)</span> }
      </h2>
      <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
        <div className="md:w-1/2 flex flex-col items-center justify-center bg-gray-700/50 p-4 rounded-lg border-2 border-dashed border-gray-600">
          <div className="w-full flex-grow flex items-center justify-center min-h-[200px]">
            {image ? (
              <img src={`data:${imageMimeType};base64,${image}`} alt="Uploaded preview" className="max-h-80 w-auto object-contain rounded-md" />
            ) : (
              <div className="text-center text-gray-400">
                <UploadIcon className="w-16 h-16 mx-auto mb-4" />
                <p>Upload an image to get started.</p>
                <p className="text-xs mt-1">(Max 4MB)</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
          <div className="mt-4 flex flex-wrap justify-center gap-4">
             <button onClick={triggerFileInput} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
               {image ? 'Change Image' : 'Upload Image'}
             </button>
            {image && (
              <button onClick={handleAnalyze} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center">
                {isLoading ? (<><LoadingIcon className="w-5 h-5 mr-2" />Analyzing...</>) : ('Analyze Image')}
              </button>
            )}
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col bg-gray-700/50 p-4 rounded-lg min-h-0">
          <h3 className="text-xl font-semibold mb-3 text-blue-200">Analysis Results</h3>
          {!isOnline && !modelsLoaded && (
              <div className="text-center text-yellow-300 bg-yellow-900/50 p-2 rounded-md mb-2 animate-pulse">
                  <p>Loading offline analysis models...</p>
              </div>
          )}
          <div className="flex-grow bg-gray-900 p-4 rounded-md overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-full text-gray-400">
                 <LoadingIcon className="w-8 h-8 mr-3"/>
                 <p>Generating analysis...</p>
              </div>
            )}
            {error && <p className="text-red-400">{error}</p>}
            {description ? (
                <p className="text-gray-300 whitespace-pre-wrap">{description.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                        // Fix: Use replace with a global regex for wider browser compatibility.
                        return <strong key={i} className="text-blue-300 block my-2">{line.replace(/\*\*/g, '')}</strong>
                    }
                    if (line.startsWith('*') && line.endsWith('*')) {
                        // Fix: Use replace with a global regex for wider browser compatibility.
                        return <em key={i} className="text-gray-400 block mt-4">{line.replace(/\*/g, '')}</em>
                    }
                    return <span key={i}>{line}<br/></span>
                })}</p>
            ) : (
                !isLoading && !error && <p className="text-gray-500 text-center my-auto">Analysis will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognitionView;