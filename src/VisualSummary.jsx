import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getAuth } from 'firebase/auth';

const VisualSummary = ({ title, onClose, fileId }) => {
  const auth = getAuth();
  const [content, setContent] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(null);

  // Fetch content from backend
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(`/files/${fileId}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status}`);
        }
        const data = await response.json();
        setContent(data.jsonData);
      } catch (error) {
        console.error('Fetch content error:', error);
        setContent({ title: 'Error', sections: [{ title: 'Error', text: 'Failed to load content', imageUrl: '', audioUrl: '' }] });
      }
    };
    if (fileId) fetchContent();
  }, [fileId]);

  // Handle audio playback
  useEffect(() => {
    if (!content || !audioEnabled || !content.sections[currentSection]?.audioUrl) return;
    const audio = new Audio(content.sections[currentSection].audioUrl);
    audio.play().catch(err => console.error('Audio playback error:', err));
    audio.onended = () => {
      if (currentSection < content.sections.length - 1) setCurrentSection(currentSection + 1);
    };
    return () => audio.pause();
  }, [content, audioEnabled, currentSection]);

  // Reset imageLoaded state when section changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(null);
  }, [currentSection]);

  if (!content) return <div className="p-6 text-center text-gray-600">Loading Visual Summary...</div>;

  const section = content.sections[currentSection];
  const isDarkImage = true; // Placeholder: Implement dynamic brightness check if needed

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="p-4 md:p-6 bg-white border-b border-gray-200 rounded-b-3xl shadow-sm flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-roboto font-bold text-gray-800 truncate">{title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-full text-sm md:text-base ${audioEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
          >
            {audioEnabled ? 'Disable Audio' : 'Enable Audio'}
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <img
          key={section.imageUrl} // Forces re-render on section change
          src={section.imageUrl}
          alt={section.title}
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            console.error('Image failed to load:', section.imageUrl);
            setImageError('Failed to load image');
            setImageLoaded(true); // Show content even if image fails
          }}
        />
        {imageLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
            <div className="max-w-2xl w-full text-center bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <h3 className="text-2xl md:text-3xl font-semibold mb-2 md:mb-4 text-gray-800">
                {section.title}
              </h3>
              <p className="text-base md:text-lg text-gray-700">
                {section.text}
              </p>
              {imageError && (
                <p className="text-red-500 mt-2 text-sm md:text-base">{imageError}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-lg md:text-xl">Loading image...</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 flex justify-between items-center">
        <button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          className="p-2 bg-blue-500 text-white rounded-full disabled:bg-gray-300 text-sm md:text-base"
        >
          Previous
        </button>
        <span className="text-gray-600 text-sm md:text-base">
          {currentSection + 1} / {content.sections.length}
        </span>
        <button
          onClick={() => setCurrentSection(Math.min(content.sections.length - 1, currentSection + 1))}
          disabled={currentSection === content.sections.length - 1}
          className="p-2 bg-blue-500 text-white rounded-full disabled:bg-gray-300 text-sm md:text-base"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default VisualSummary;