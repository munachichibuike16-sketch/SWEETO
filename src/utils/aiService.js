/**
 * AI Service for SWEETO HUB
 * Integrates with Google Gemini API
 */

export const testGeminiConnection = async (apiKey) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      return { success: false, message: data.error.message };
    }
    
    const models = data.models?.map(m => m.name.replace('models/', '')) || [];
    return { success: true, message: 'READY', models };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export const generateAIProductDescription = async (imageSrc, apiKey, language = 'en', productData = {}, model = 'gemini-1.5-flash') => {
  try {
    // Handle both URLs and Base64
    let imageData;
    let mimeType = 'image/jpeg';

    if (imageSrc.startsWith('data:')) {
      const parts = imageSrc.split(';base64,');
      mimeType = parts[0].split(':')[1];
      imageData = parts[1];
    } else {
      // Fetch image and convert to base64
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      mimeType = blob.type;
      imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
    }

    const prompt = `Analyze this product image and write a premium, high-converting product description in ${language === 'fr' ? 'French' : 'English'}. 
    Product Name: ${productData.name || 'Unknown'}.
    Focus on features, benefits, and technical excellence. Keep it under 150 words. Output ONLY the description text.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageData } }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      if (data.error.status === 'PERMISSION_DENIED') throw new Error('INVALID_API_KEY');
      if (data.error.status === 'RESOURCE_EXHAUSTED') throw new Error('AI_QUOTA_EXCEEDED');
      throw new Error(data.error.message);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('AI_GEN_ERROR: No content generated');

    return text.trim();
  } catch (err) {
    console.error('Gemini API Error:', err);
    throw err;
  }
};
