import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BusinessIdea, StitchPromptOptions, StitchPrompt, SketchStep, StoryboardPage, InterviewQuestion, FeedbackAnalysisResult, ThreeStepSketchComposite, StoryboardComposite } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const languageInstructions = {
  ko: '응답은 반드시 한국어로만 해주세요. JSON 형식의 마크다운은 제거해주세요.',
  en: 'You must respond only in English. Do not include markdown formatting for JSON.',
  am: 'በአማርኛ ብቻ መልስ ይስጡ. ለ JSON የማርክዳাউন ቅርጸትን አታካትት።',
};

export const generateBusinessIdeas = async (
  skills: string,
  target: string,
  needs: string,
  language: keyof typeof languageInstructions,
  sketchStyle: 'simple' | 'professional' = 'simple'
): Promise<BusinessIdea[]> => {
  
  const imageStyleInstructions = {
    simple: {
      en: "A CHILD-LIKE DRAWING style prompt for an image generation AI. The image should look like a 5-8 year old child's drawing - very simple, clumsy, wobbly lines, basic shapes (circles for heads, rectangles for bodies), stick figures with round heads and simple smiling faces, uneven and imperfect, like a kindergarten drawing (extremely basic and childish, NOT skillful at all). Keep it under 15 words and use very basic descriptions like \"child's drawing of leather bag\", \"simple stick figure making wallet\", \"kindergarten sketch of belt and tools\".",
      ko: "어린이 그림 스타일 프롬프트를 이미지 생성 AI를 위해 작성하세요. 이미지는 5-8살 어린이가 그린 그림처럼 보여야 합니다 - 매우 단순하고, 서툴고, 삐뚤빼뚤한 선, 기본 도형들 (머리는 원, 몸은 네모), 동그란 머리와 간단한 웃는 얼굴을 가진 막대 인형, 불균형하고 불완전한, 유치원생 그림 같은 느낌 (극도로 기본적이고 유치하게, 전혀 능숙하지 않게). 15단어 미만으로 유지하고 \"가죽 가방 어린이 그림\", \"지갑 만드는 막대 인형\", \"벨트와 도구 유치원 스케치\"처럼 매우 기본적인 설명을 사용하세요.",
      am: "የልጅ ስዕል ዘይቤ ጥያቄ ለምስል አመንጪ AI። ምስሉ እንደ 5-8 ዓመት ልጅ ስዕል መምሰል አለበት - በጣም ቀላል፣ ችኮላ፣ የተዳዳ መስመሮች፣ መሰረታዊ ቅርጾች (ለጭንቅላት ክቦች፣ ለሰውነት አራት ማዕዘኖች)፣ ክብ ጭንቅላቶች እና ቀላል የሚስቁ ፊቶች ያላቸው የእንጨት ምስሎች፣ ያልተመጣጠነ እና ፍጹም ያልሆነ፣ እንደ የመዋለ ህጻናት ስዕል (በጣም መሰረታዊ እና ልጅነት፣ በጭራሽ የተካነ አይደለም)። ከ15 ቃላት በታች ያድርጉት እና እንደ \"የቆዳ ቦርሳ የልጅ ስዕል\"፣ \"ቦርሳ የሚሠራ ቀላል የእንጨት ምስል\"፣ \"የቀበቶ እና መሳሪያዎች የመዋለ ህጻናት ስዕል\" ያሉ በጣም መሰረታዊ መግለጫዎችን ይጠቀሙ።"
    },
    professional: {
      en: "A HAND-DRAWN SKETCH style prompt for an image generation AI. The image should look like a professional hand-drawn sketch or illustration - clean lines, detailed shading, artistic and skillful execution, workshop-quality drawing with good proportions and perspective. Use descriptive terms like \"professional sketch of leather bag\", \"detailed hand-drawn wallet illustration\", \"artistic rendering of leather workshop\".",
      ko: "손그림 스케치 스타일 프롬프트를 이미지 생성 AI를 위해 작성하세요. 이미지는 전문적인 손그림 스케치나 일러스트레이션처럼 보여야 합니다 - 깔끔한 선, 세밀한 음영, 예술적이고 숙련된 실행, 좋은 비율과 원근감을 가진 워크샵 수준의 드로잉. \"가죽 가방의 전문적인 스케치\", \"세밀한 손그림 지갑 일러스트레이션\", \"가죽 공방의 예술적 렌더링\"과 같은 설명적인 용어를 사용하세요.",
      am: "በእጅ የተሳለ ንድፍ ዘይቤ ጥያቄ ለምስል አመንጪ AI። ምስሉ እንደ ሙያዊ በእጅ የተሳለ ንድፍ ወይም ምስል መምሰል አለበት - ንጹህ መስመሮች፣ ዝርዝር ጥላ፣ ጥበባዊ እና የተካነ አፈጻጸም፣ ጥሩ መጠን እና አመለካከት ያለው የወርክሾፕ ጥራት ስዕል። እንደ \"የቆዳ ቦርሳ ሙያዊ ንድፍ\"፣ \"ዝርዝር በእጅ የተሳለ የቦርሳ ምስል\"፣ \"የቆዳ ወርክሾፕ ጥበባዊ ስራ\" ያሉ ገላጭ ቃላትን ይጠቀሙ።"
    }
  };

  const prompts = {
    en: `
      Based on the following user profile, generate 16 innovative business ideas. The ideas should be relevant to the user's skills, target customers, and their needs. If the user mentions specific keywords or themes in their profile (e.g., leather crafts, technology, food service), generate ideas related to those themes.

      The output should follow a T-bar structure. For each idea, you must provide:
      1. A snappy and clear title.
      2. A detailed description with 4-6 bullet points explaining the business concept, target market, unique value proposition, potential challenges, and revenue model. IMPORTANT: Each bullet point MUST start with a bullet symbol (•) and be on a NEW LINE. Use newline characters (\\n) to separate each bullet point. Example format:
      • First bullet point here
      • Second bullet point here
      • Third bullet point here
      3. ${imageStyleInstructions[sketchStyle].en}

      - User's skills and experience: ${skills}
      - Target customers: ${target}
      - Needs in the user's environment: ${needs}

      Generate ideas that align with the keywords and themes mentioned in the user's profile above.

      ${languageInstructions.en}
    `,
    ko: `
      다음 사용자 프로필을 바탕으로 16개의 혁신적인 비즈니스 아이디어를 생성해주세요. 아이디어는 사용자의 기술, 타겟 고객 및 요구사항과 관련이 있어야 합니다. 사용자가 프로필에서 특정 키워드나 테마를 언급한 경우 (예: 가죽 공예, 기술, 음식 서비스), 해당 테마와 관련된 아이디어를 생성하세요.

      출력은 T-bar 구조를 따라야 합니다. 각 아이디어에 대해 다음을 제공해야 합니다:
      1. 간결하고 명확한 제목.
      2. 비즈니스 컨셉, 타겟 시장, 고유한 가치 제안, 잠재적 과제, 수익 모델을 설명하는 4-6개의 불렛 포인트가 포함된 상세한 설명. 중요: 각 불렛 포인트는 반드시 불렛 기호(•)로 시작하고 새로운 줄에 있어야 합니다. 줄바꿈 문자(\\n)를 사용하여 각 불렛 포인트를 구분하세요. 예시 형식:
      • 첫 번째 불렛 포인트
      • 두 번째 불렛 포인트
      • 세 번째 불렛 포인트
      3. ${imageStyleInstructions[sketchStyle].ko}

      - 사용자의 기술 및 경험: ${skills}
      - 타겟 고객: ${target}
      - 사용자 환경의 요구사항: ${needs}

      위 사용자 프로필에서 언급된 키워드와 테마에 맞는 아이디어를 생성하세요.

      ${languageInstructions.ko}
    `,
    am: `
      በሚከተለው የተጠቃሚ መገለጫ ላይ በመመስረት 16 አዳዲስ የንግድ ሀሳቦችን ይፍጠሩ። ሀሳቦቹ ከተጠቃሚው ችሎታዎች፣ የታለሙ ደንበኞች እና ፍላጎቶች ጋር ተዛማጅነት ሊኖራቸው ይገባል። ተጠቃሚው በመገለጫው ውስጥ የተወሰኑ ቁልፍ ቃላትን ወይም ጭብጦችን ካጠቀሰ (ለምሳሌ የቆዳ ስራ፣ ቴክኖሎጂ፣ የምግብ አገልግሎት)፣ ከእነዚያ ጭብጦች ጋር የተያያዙ ሀሳቦችን ይፍጠሩ።

      ውጤቱ የቲ-ባር (T-bar) መዋቅርን መከተል አለበት። ለእያንዳንዱ ሀሳብ የሚከተሉትን ማቅረብ አለብዎት፦
      1. ማራኪ እና ግልጽ ርዕስ።
      2. የንግድ ጽንሰ-ሀሳብ፣ የታለመ ገበያ፣ ልዩ እሴት ሀሳብ፣ ሊኖሩ የሚችሉ ችግሮች እና የገቢ ሞዴል የሚያብራሩ 4-6 ነጥቦች ያለው ዝርዝር መግለጫ። አስፈላጊ: እያንዳንዱ ነጥብ በነጥብ ምልክት (•) መጀመር እና በአዲስ መስመር ላይ መሆን አለበት። እያንዳንዱን ነጥብ ለመለየት የመስመር መቁረጫ ቁምፊዎችን (\\n) ይጠቀሙ። የምሳሌ ቅርጸት:
      • የመጀመሪያ ነጥብ
      • ሁለተኛ ነጥብ
      • ሦስተኛ ነጥብ
      3. ${imageStyleInstructions[sketchStyle].am}

      - የተጠቃሚው ችሎታ እና ልምድ፦ ${skills}
      - የታለሙ ደንበኞች፦ ${target}
      - በተጠቃሚው አካባቢ ያሉ ፍላጎቶች፦ ${needs}

      ከላይ በተጠቃሚው መገለጫ ውስጥ የተጠቀሱትን ቁልፍ ቃላት እና ጭብጦች ጋር የሚጣጣሙ ሀሳቦችን ይፍጠሩ።

      ${languageInstructions.am}
    `
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompts[language],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  sketchPrompt: { type: Type.STRING, description: "A hand-drawn sketch or doodle-style prompt for a text-to-image AI. Should describe a simple, rough, pencil-drawn workshop sketch." }
                },
                required: ['title', 'description', 'sketchPrompt']
              }
            }
          },
        }
      }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    const ideasWithNullUrl = (result.ideas as Omit<BusinessIdea, 'sketchUrl'>[]).map(idea => ({
        ...idea,
        sketchUrl: null
    }));
    return ideasWithNullUrl;

  } catch (error) {
    console.error('Error generating business ideas:', error);
    throw new Error('Failed to generate business ideas. Please check your API key and try again.');
  }
};


export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            console.error(`Image generation blocked: ${response.promptFeedback.blockReason}`, response.promptFeedback.safetyRatings);
            throw new Error(`Image generation was blocked for safety reasons: ${response.promptFeedback.blockReason}`);
        }
        throw new Error('Image generation failed: No content was returned from the API.');
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }

    throw new Error('No image data found in the API response.');
  } catch (error) {
    console.error('Error in generateImage function:', error);
    throw error;
  }
};

export const generateThreeStepSketch = async (idea: BusinessIdea, language: keyof typeof languageInstructions): Promise<{ [key: string]: SketchStep[] }> => {

    const prompts = {
      en: `
        For the business idea "${idea.title}: ${idea.description}", create 3 distinct variations of a 3-step user flow sketch. This flow should represent the key screens or interactions a user would have with the product/service.

        For each step in each of the 3 variations, provide:
        1. A concise title for the UI screen/step.
        2. A scenario-based 'description' with 3-4 bullet points that focus on WHAT THE USER DOES and WHY, not specific design details. IMPORTANT: Each bullet point MUST be on a NEW LINE separated by newline characters (\\n). This should inspire creativity, not prescribe exact layouts. Example format:
           • User arrives wanting to explore available leather products
           • Browses through various categories to find what interests them
           • Gets inspired by handcrafted designs and unique styles
           • Feels excited to discover something special
        3. A HAND-DRAWN SKETCH style 'imagePrompt' for an image generation AI. The image should look like a quick pencil sketch or wireframe drawn on paper during a workshop - simple, rough, informal, hand-drawn style (not polished or digital). Use simple visual concepts like "rough sketch of person using phone", "hand-drawn shopping cart wireframe", "pencil drawing of hands exchanging items". Keep it under 15 words.
        4. A detailed breakdown of the screen including: layout, components, interactions, visuals, and tips (this is for technical reference, not displayed to user).

        The final output must be a JSON array containing 3 arrays. Each inner array represents one 3-step sketch variation and must contain exactly 3 step objects.

        ${languageInstructions.en}
      `,
      ko: `
        비즈니스 아이디어 "${idea.title}: ${idea.description}"에 대해, 3단계 사용자 플로우 스케치의 3가지 고유한 버전을 만드세요. 이 플로우는 사용자가 제품/서비스와 가질 수 있는 핵심 화면이나 상호작용을 나타내야 합니다.

        3가지 각 버전의 각 단계에 대해 다음을 제공하세요:
        1. UI 화면/단계를 위한 간결한 제목.
        2. 시나리오 기반 'description'을 3-4개의 불렛 포인트로 작성하되, 구체적인 디자인 디테일이 아닌 사용자가 무엇을 하고 왜 하는지에 초점을 맞추세요. 중요: 각 불렛 포인트는 반드시 줄바꿈 문자(\\n)로 구분된 새로운 줄에 있어야 합니다. 정확한 레이아웃을 지시하는 것이 아니라 창의성을 자극해야 합니다. 예시 형식:
           • 사용자가 가죽 제품을 탐색하고 싶어서 도착함
           • 다양한 카테고리를 둘러보며 관심 있는 것을 찾음
           • 수작업 디자인과 독특한 스타일에 영감을 받음
           • 특별한 무언가를 발견하는 것에 설렘을 느낌
        3. 손그림 스케치 스타일 'imagePrompt'를 이미지 생성 AI를 위해 작성하세요. 이미지는 워크샵에서 종이에 연필로 빠르게 그린 스케치나 와이어프레임처럼 보여야 합니다 - 단순하고, 거칠고, 비공식적인, 손으로 그린 스타일 (세련되거나 디지털 느낌이 아님). "전화 사용하는 사람의 거친 스케치", "손으로 그린 쇼핑 카트 와이어프레임", "물건을 주고받는 손의 연필 드로잉"과 같은 간단한 시각적 개념을 사용하세요. 15단어 미만으로 유지하세요.
        4. 레이아웃, 구성 요소, 상호작용, 시각적 요소 및 팁을 포함한 화면의 상세한 분석 (이것은 기술 참고용이며 사용자에게 표시되지 않음).

        최종 출력은 3개의 배열을 포함하는 JSON 배열이어야 합니다. 각 내부 배열은 하나의 3단계 스케치 버전을 나타내며 정확히 3개의 단계 객체를 포함해야 합니다.

        ${languageInstructions.ko}
      `,
      am: `
        ለቢዝነስ ሀሳቡ "${idea.title}: ${idea.description}"፣ የ3-ደረጃ የተጠቃሚ ፍሰት ንድፍ 3 የተለያዩ ልዩነቶችን ይፍጠሩ። ይህ ፍሰት ተጠቃሚው ከምርቱ/አገልግሎቱ ጋር የሚኖረውን ቁልፍ ማያ ገጾች ወይም መስተጋብሮችን መወከል አለበት።

        በእያንዳንዱ 3 ልዩነቶች ውስጥ ለእያንዳንዱ ደረጃ የሚከተሉትን ያቅርቡ፦
        1. ለ UI ማያ ገጽ/ደረጃ አጭር ርዕስ።
        2. በሁኔታ ላይ የተመሰረተ 'description' በ3-4 ነጥቦች፣ ተጠቃሚው ምን እንደሚያደርግ እና ለምን እንደሆነ ላይ የሚያተኩር፣ ልዩ የዲዛይን ዝርዝሮች ሳይሆኑ። አስፈላጊ: እያንዳንዱ ነጥብ በመስመር መቁረጫ ቁምፊዎች (\\n) የተለየ አዲስ መስመር ላይ መሆን አለበት። ይህ ትክክለኛ አቀማመጦችን መመሪያ ሳይሆን ፈጠራነትን ማነሳሳት አለበት። የምሳሌ ቅርጸት:
           • ተጠቃሚው የቆዳ ምርቶችን ለመመርመር ፍላጎት ያለው ይመጣል
           • ፍላጎታቸውን የሚያገኙበትን የተለያዩ ምድቦችን ያሰስታል
           • በእጅ በተሰሩ ንድፎች እና ልዩ ስታይሎች ተነሳስቷል
           • ልዩ ነገር ማግኘቱን በመገንዘብ ደስተኛ ይሆናል
        3. በእጅ የተሳለ ንድፍ ዘይቤ 'imagePrompt' ለምስል አመንጪ AI። ምስሉ በወርክሾፕ ወቅት በወረቀት ላይ በእርሳስ በፍጥነት እንደተሳለ ቀላል ንድፍ ወይም wireframe መምሰል አለበት - ቀላል፣ ያልተለመደ፣ መደበኛ ያልሆነ፣ በእጅ የተሳለ ዘይቤ (የተሻሻለ ወይም ዲጂታል ሳይሆን)። እንደ "ስልክ የሚጠቀም ሰው ያልተለመደ ንድፍ"፣ "በእጅ የተሳለ የግዢ ጋሪ wireframe"፣ "ዕቃዎችን የሚለዋወጡ እጆች በእርሳስ ስዕል" ያሉ ቀላል የእይታ ፅንሰ-ሀሳቦችን ይጠቀሙ። ከ15 ቃላት በታች ያቆዩት።
        4. አቀማመጥን፣ ክፍሎችን፣ መስተጋብሮችን፣ ምስላዊ ነገሮችን እና ምክሮችን ጨምሮ ዝርዝር የማያ ገጽ ትንታኔ (ይህ ለቴክኒካዊ ማጣቀሻ ሲሆን ለተጠቃሚ አይታይም)።

        የመጨረሻው ውጤት 3 ድርድሮችን የያዘ የ JSON ድርድር መሆን አለበት። እያንዳንዱ ውስጣዊ ድርድር አንድ የ3-ደረጃ ንድፍ ልዩነትን የሚወክል ሲሆን በትክክል 3 የደረጃ ዕቃዎችን መያዝ አለበት።

        ${languageInstructions.am}
      `
    };
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompts[language],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: "Title of the step (e.g., Landing Page, Product Details)" },
                                description: { type: Type.STRING, description: "Scenario-based description with 3-4 bullet points focusing on what the user does and why, separated by newlines." },
                                imagePrompt: { type: Type.STRING, description: "A detailed prompt for an image generation AI to visualize this UI screen." },
                                details: {
                                    type: Type.OBJECT,
                                    properties: {
                                        layout: { type: Type.STRING },
                                        components: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        interactions: { type: Type.STRING },
                                        visuals: { type: Type.STRING },
                                        tips: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        const variations = JSON.parse(jsonString) as Omit<SketchStep, 'imageUrl'>[][];
        const variationsWithNullUrl = variations.map(variation => 
            variation.map(step => ({
                ...step,
                imageUrl: null
            }))
        );
        
        const variationsMap: { [key: string]: SketchStep[] } = {};
        variationsWithNullUrl.forEach((variation, index) => {
            variationsMap[`v${index}`] = variation;
        });
        return variationsMap;

    } catch (error) {
        console.error('Error generating 3-step sketch versions:', error);
        throw new Error('Failed to generate sketch details.');
    }
};

export const generateStoryboardPages = async (idea: BusinessIdea, sketch: SketchStep[], language: keyof typeof languageInstructions, customDescription?: string): Promise<{ [key: string]: StoryboardPage[] }> => {
    const sketchSummary = customDescription || sketch.map((step, i) => `Step ${i+1}: ${step.title} - ${step.details.layout}. Key components: ${step.details.components.join(', ')}`).join('; ');

    const prompts = {
      en: `
        Based on the business idea "${idea.title}: ${idea.description}" and the user flow: "${sketchSummary}", create 2 distinct variations of an 8-panel storyboard that visualizes the customer's journey.

        For each of the 8 panels in each of the 2 variations, provide:
        1. A short, descriptive title for the panel (max 5 words).
        2. A detailed 'description' with 3-5 bullet points explaining the purpose, user experience, key features, or outcomes for this panel. IMPORTANT: Each bullet point MUST be on a NEW LINE separated by newline characters (\\n). Format as markdown bullet points (•) with bold key phrases followed by descriptions. Example format:
           • **Purpose:** Provide users with personalized concert recommendations
           • **User Experience:** Offers tailored concert suggestions that match users' musical tastes
           • **Key Features:** Creates anticipation and excitement by aligning recommendations with special occasions
        3. A HAND-DRAWN SKETCH style 'imagePrompt' for an image generation AI. The image should look like a quick pencil sketch or storyboard frame drawn on paper during a workshop - simple, rough, informal, hand-drawn style (not polished or digital). Use brief descriptions like "pencil sketch of person browsing laptop", "rough drawing of happy customer with package", "hand-drawn sketch of hands holding product". Keep it under 10 words.

        The final output must be a JSON array containing 2 arrays. Each inner array represents one 8-panel storyboard variation.

        ${languageInstructions.en}
      `,
      ko: `
        비즈니스 아이디어 "${idea.title}: ${idea.description}"와 사용자 플로우 "${sketchSummary}"를 바탕으로, 고객의 여정을 시각화하는 8개 패널 스토리보드의 2가지 버전을 만드세요.

        2가지 각 버전의 8개 패널 각각에 대해:
        1. 짧고 설명적인 제목 (최대 5단어).
        2. 이 패널의 목적, 사용자 경험, 주요 기능 또는 결과를 설명하는 3-5개의 불렛 포인트가 포함된 상세한 'description'. 중요: 각 불렛 포인트는 반드시 줄바꿈 문자(\\n)로 구분된 새로운 줄에 있어야 합니다. 마크다운 불렛 포인트(•) 형식으로 작성하고 볼드체 핵심 문구 다음에 설명을 추가하세요. 예시 형식:
           • **목적:** 사용자에게 개인화된 콘서트 추천 제공
           • **사용자 경험:** 사용자의 음악 취향에 맞는 맞춤형 콘서트 제안 제공
           • **주요 기능:** 특별한 날짜와 연계하여 기대감과 흥미 유발
        3. 손그림 스케치 스타일 'imagePrompt'를 이미지 생성 AI를 위해 작성하세요. 이미지는 워크샵에서 종이에 연필로 빠르게 그린 스케치나 스토리보드 프레임처럼 보여야 합니다 - 단순하고, 거칠고, 비공식적인, 손으로 그린 스타일 (세련되거나 디지털 느낌이 아님). "노트북 검색하는 사람의 연필 스케치", "상자를 든 행복한 고객의 거친 드로잉", "제품을 든 손의 손그림 스케치"와 같은 간단한 설명을 사용하세요. 10단어 미만으로 유지.

        최종 출력은 2개의 배열을 포함하는 JSON 배열이어야 합니다. 각 배열은 하나의 8개 패널 스토리보드 버전을 나타냅니다.

        ${languageInstructions.ko}
      `,
      am: `
        በቢዝነስ ሀሳቡ "${idea.title}: ${idea.description}" እና የተጠቃሚ ፍሰት "${sketchSummary}" ላይ በመመስረት፣ የደንበኛውን ጉዞ የሚያሳይ 8-ፓናል የታሪክ ሰሌዳ 2 የተለያዩ ልዩነቶችን ይፍጠሩ።

        በእያንዳንዱ 2 ልዩነቶች ውስጥ ላሉት 8 ፓናሎች፦
        1. አጭር እና ገላጭ ርዕስ (ከ5 ቃላት በታች)።
        2. የዚህን ፓናል አላማ፣ የተጠቃሚ ልምድ፣ ቁልፍ ባህሪያት ወይም ውጤቶች የሚያብራራ 3-5 ነጥቦች ያለው ዝርዝር 'description'። አስፈላጊ: እያንዳንዱ ነጥብ በመስመር መቁረጫ ቁምፊዎች (\\n) የተለየ አዲስ መስመር ላይ መሆን አለበት። እንደ ማርክዳውን ነጥቦች (•) ይቅረጹ፣ ከማብራሪያው በፊት ቁልፍ ሀረጎችን ማድመቅ። የምሳሌ ቅርጸት:
           • **አላማ:** ለተጠቃሚዎች ግላዊ የኮንሰርት ምክሮችን ማቅረብ
           • **የተጠቃሚ ልምድ:** የተጠቃሚዎችን የሙዚቃ ምርጫዎች የሚዛመዱ ምክሮችን ማቅረብ
           • **ቁልፍ ባህሪያት:** ምክሮችን ከልዩ ጊዜያት ጋር በማቀናጀት በጉጉት እና ደስታን መፍጠር
        3. በእጅ የተሳለ ንድፍ ዘይቤ 'imagePrompt' ለምስል አመንጪ AI። ምስሉ በወርክሾፕ ወቅት በወረቀት ላይ በእርሳስ በፍጥነት እንደተሳለ ቀላል ንድፍ ወይም የታሪክ ሰሌዳ ፍሬም መምሰል አለበት - ቀላል፣ ያልተለመደ፣ መደበኛ ያልሆነ፣ በእጅ የተሳለ ዘይቤ (የተሻሻለ ወይም ዲጂታል ሳይሆን)። እንደ "በላፕቶፕ የሚያስሱ ሰው በእርሳስ ንድፍ"፣ "ፓኬጅ ያለው ደስተኛ ደንበኛ ያልተለመደ ስዕል"፣ "ምርት የያዙ እጆች በእጅ የተሳለ ንድፍ" ያሉ አጭር መግለጫዎችን ይጠቀሙ። ከ10 ቃላት በታች ያቆዩት።

        የመጨረሻው ውጤት 2 ድርድሮችን የያዘ የ JSON ድርድር መሆን አለበት። እያንዳንዱ ድርድር አንድ የ8-ፓናል የታሪክ ሰሌዳ ልዩነትን ይወክላል።

        ${languageInstructions.am}
      `
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompts[language],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              title: { type: Type.STRING },
                              description: { type: Type.STRING },
                              imagePrompt: { type: Type.STRING }
                          },
                          required: ['title', 'description', 'imagePrompt']
                      }
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        const variations = JSON.parse(jsonString) as Omit<StoryboardPage, 'imageUrl'>[][];
        const variationsWithNullUrl = variations.map(variation => 
            variation.map(page => ({
                ...page,
                imageUrl: null
            }))
        );
        
        const variationsMap: { [key: string]: StoryboardPage[] } = {};
        variationsWithNullUrl.forEach((variation, index) => {
            variationsMap[`v${index}`] = variation;
        });
        return variationsMap;
    } catch (error) {
        console.error('Error generating storyboard pages:', error);
        throw new Error('Failed to generate storyboard pages.');
    }
};

export const generateStitchPrompt = async (options: StitchPromptOptions, language: keyof typeof languageInstructions): Promise<StitchPrompt> => {
    const pagesString = options.pages
        .filter(p => p.enabled)
        .map((page, index) => `
### Page ${index + 1}
- **Purpose**: ${page.purpose}
- **Key Content/Features**: ${page.content}
`).join('');

    const prompts = {
      en: `
        Generate an optimized, comprehensive, and detailed prompt for a generative AI web design tool like Google Stitch. The goal is to create a complete website based on the user's specifications.

        **1. Core Project Information:**
        - **Problem Statement**: ${options.problem}
        - **Proposed Solution**: ${options.solution}
        - **Project Type**: ${options.projectType}
        - **Additional Requirements**: ${options.additionalRequirements || 'None'}

        **2. Design and Aesthetics:**
        - **Target UI Language**: ${options.uiLanguage}
        - **Overall Design Style**: ${options.designStyle}
        - **Color Palette**: ${options.colorPalette}
        - **Typography/Font Style**: ${options.typography}

        **3. Structure and Layout:**
        - **General Layout Principle**: ${options.layout}
        - **Required UI Components**: Create a cohesive design that includes the following components: ${options.components.join(', ')}.

        **4. Page-by-Page Breakdown:**
        The website should consist of ${options.pages.filter(p => p.enabled).length} pages with the following details:
        ${pagesString}

        **Final Prompt Generation Instructions:**
        Synthesize all the above information into a single, cohesive, and highly detailed prompt. The prompt should be structured logically, starting with a high-level overview and then detailing the styles, layout, components, and page structure. It must be written in a way that an AI design tool can easily interpret and execute to build a functional and visually appealing website that meets all user requirements.
        
        ${languageInstructions.en}
      `,
      ko: `
        Google Stitch와 같은 생성형 AI 웹 디자인 도구를 위한 최적화되고 포괄적이며 상세한 프롬프트를 생성하세요. 목표는 사용자 사양에 따라 완전한 웹사이트를 만드는 것입니다.

        **1. 핵심 프로젝트 정보:**
        - **문제 정의**: ${options.problem}
        - **제안된 솔루션**: ${options.solution}
        - **프로젝트 유형**: ${options.projectType}
        - **추가 요구사항**: ${options.additionalRequirements || '없음'}

        **2. 디자인 및 미학:**
        - **대상 UI 언어**: ${options.uiLanguage}
        - **전체적인 디자인 스타일**: ${options.designStyle}
        - **색상 팔레트**: ${options.colorPalette}
        - **타이포그래피/글꼴 스타일**: ${options.typography}

        **3. 구조 및 레이아웃:**
        - **일반 레이아웃 원칙**: ${options.layout}
        - **필수 UI 구성 요소**: 다음 구성 요소를 포함하는 통일성 있는 디자인을 만드세요: ${options.components.join(', ')}.

        **4. 페이지별 분석:**
        웹사이트는 다음 세부 정보를 가진 ${options.pages.filter(p => p.enabled).length}개의 페이지로 구성되어야 합니다:
        ${pagesString}

        **최종 프롬프트 생성 지침:**
        위의 모든 정보를 단일의, 통일성 있고 매우 상세한 프롬프트로 종합하세요. 프롬프트는 높은 수준의 개요로 시작하여 스타일, 레이아웃, 구성 요소 및 페이지 구조를 자세히 설명하는 논리적인 구조여야 합니다. AI 디자인 도구가 모든 사용자 요구사항을 충족하는 기능적이고 시각적으로 매력적인 웹사이트를 쉽게 해석하고 실행할 수 있는 방식으로 작성되어야 합니다.
        
        ${languageInstructions.ko}
      `,
      am: `
        እንደ Google Stitch ላለ አመንጪ AI ድር ንድፍ መሳሪያ የተመቻቸ፣ አጠቃላይ እና ዝርዝር ጥያቄ ይፍጠሩ። ግቡ በተጠቃሚው ዝርዝር መግለጫዎች ላይ በመመስረት የተሟላ ድር ጣቢያ መፍጠር ነው።

        **1. ዋና የፕሮጀክት መረጃ:**
        - **የችግር መግለጫ**: ${options.problem}
        - **የቀረበ መፍትሄ**: ${options.solution}
        - **የፕሮጀክት አይነት**: ${options.projectType}
        - **ተጨማሪ መስፈርቶች**: ${options.additionalRequirements || 'የለም'}

        **2. ንድፍ እና ውበት:**
        - **ዒላማ UI ቋንቋ**: ${options.uiLanguage}
        - **አጠቃላይ የንድፍ ዘይቤ**: ${options.designStyle}
        - **የቀለም ቤተ-ስዕል**: ${options.colorPalette}
        - **የፊደል አጻጻፍ/የቅርጸ-ቁምፊ ዘይቤ**: ${options.typography}

        **3. መዋቅር እና አቀማመጥ:**
        - **አጠቃላይ የአቀማመጥ መርህ**: ${options.layout}
        - **የሚያስፈልጉ የ UI ክፍሎች**: የሚከተሉትን ክፍሎች የሚያካትት የተቀናጀ ንድፍ ይፍጠሩ፦ ${options.components.join(', ')}.

        **4. የገጽ-በገጽ ዝርዝር:**
        ድር ጣቢያው የሚከተሉትን ዝርዝሮች የያዙ ${options.pages.filter(p => p.enabled).length} ገጾችን ማካተት አለበት፦
        ${pagesString}

        **የመጨረሻ የጥያቄ አመንጪ መመሪያዎች:**
        ከላይ የተጠቀሱትን መረጃዎች በሙሉ ወደ አንድ፣ የተቀናጀ እና በጣም ዝርዝር ጥያቄ ያዋህዱ። ጥያቄው በከፍተኛ ደረጃ አጠቃላይ እይታ በመጀመር እና ከዚያም ቅጦችን፣ አቀማመጥን፣ ክፍሎችን እና የገጽ አወቃቀርን በዝርዝር በመግለጽ በሎጂክ የተዋቀረ መሆን አለበት። የ AI ንድፍ መሳሪያ ሁሉንም የተጠቃሚ መስፈርቶች የሚያሟላ ተግባራዊ እና በእይታ ማራኪ የሆነ ድር ጣቢያ በቀላሉ ሊተረጉም እና ሊፈጽም በሚችል መልኩ መፃፍ አለበት።
        
        ${languageInstructions.am}
      `
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompts[language],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A concise title for the project." },
                        description: { type: Type.STRING, description: "A short description of the project." },
                        optimizedPrompt: { type: Type.STRING, description: "The final, optimized prompt for the design AI." }
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as StitchPrompt;
    } catch(error) {
        console.error('Error generating Stitch prompt:', error);
        throw new Error('Failed to generate the Stitch prompt.');
    }
};

export const generateInterviewQuestions = async (idea: BusinessIdea, language: keyof typeof languageInstructions): Promise<InterviewQuestion[]> => {
    
    const prompts = {
      en: `
        You are a senior UX researcher creating user interview questions for a new business idea.
        The business idea is:
        Title: "${idea.title}"
        Description: "${idea.description}"

        Generate 10 open-ended interview questions to validate this idea with potential users.
        For each question, provide:
        - A category (e.g., "Current situation assessment", "Problems and needs", "Solution validation").
        - The question itself.
        - A brief explanation of the intent behind the question.
        - 2-3 potential follow-up questions.
        
        ${languageInstructions.en}
      `,
      ko: `
        당신은 새로운 비즈니스 아이디어에 대한 사용자 인터뷰 질문을 만드는 시니어 UX 연구원입니다.
        비즈니스 아이디어는 다음과 같습니다:
        제목: "${idea.title}"
        설명: "${idea.description}"

        잠재 사용자와 이 아이디어를 검증하기 위한 10개의 개방형 인터뷰 질문을 생성해주세요.
        각 질문에 대해 다음을 제공해주세요:
        - 카테고리 (예: "현재 상황 평가", "문제 및 요구사항", "솔루션 검증").
        - 질문 자체.
        - 질문의 의도에 대한 간략한 설명.
        - 2-3개의 잠재적인 후속 질문.
        
        ${languageInstructions.ko}
      `,
      am: `
        እርስዎ ለአዲስ የንግድ ሃሳብ የተጠቃሚ ቃለ መጠይቅ ጥያቄዎችን የሚፈጥሩ ከፍተኛ የ UX ተመራማሪ ነዎት።
        የንግድ ሃሳቡ ይህ ነው፦
        ርዕስ፦ "${idea.title}"
        መግለጫ፦ "${idea.description}"

        ይህንን ሃሳብ ከሚችሉ ተጠቃሚዎች ጋር ለማረጋገጥ 10 ክፍት የሆኑ የቃለ መጠይቅ ጥያቄዎችን ይፍጠሩ።
        ለእያንዳንዱ ጥያቄ የሚከተሉትን ያቅርቡ፦
        - ምድብ (ለምሳሌ፦ "የአሁኑ ሁኔታ ግምገማ", "ችግሮች እና ፍላጎቶች", "የመፍትሄ ማረጋገጫ")።
        - ጥያቄው ራሱ።
        - ከጥያቄው በስተጀርባ ያለውን ዓላማ አጭር ማብራሪያ።
        - ከ2-3 ሊሆኑ የሚችሉ ተከታይ ጥያቄዎች።
        
        ${languageInstructions.am}
      `
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompts[language],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING },
                                    question: { type: Type.STRING },
                                    intent: { type: Type.STRING },
                                    followUp: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ['category', 'question', 'intent', 'followUp']
                            }
                        }
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result.questions as InterviewQuestion[];
    } catch (error) {
        console.error('Error generating interview questions:', error);
        throw new Error('Failed to generate interview questions.');
    }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error("Failed to read blob as string."));
            }
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const analyzeInterviewFeedback = async (
    records: { type: 'text'; content: string }[] | { type: 'audio'; blob: Blob }[],
    language: keyof typeof languageInstructions
): Promise<FeedbackAnalysisResult> => {
    if (records.length === 0) {
        throw new Error("No records provided for analysis.");
    }

    const isAudio = records[0].type === 'audio';
    let prompt: string;
    const contentParts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [];
    const feedbackAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            keyPatterns: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        pattern: { type: Type.STRING },
                        description: { type: Type.STRING },
                        count: { type: Type.NUMBER }
                    },
                    required: ['pattern', 'description', 'count']
                }
            },
            insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                        item: { type: Type.STRING },
                        category: { type: Type.STRING }
                    },
                    required: ['priority', 'item', 'category']
                }
            }
        },
        required: ['summary', 'keyPatterns', 'insights', 'actionItems']
    };

    const analysisInstructions = {
      en: `
        Please analyze and provide the following:
        1.  **Summary**: A brief, high-level overview of the key findings.
        2.  **Key Patterns**: Identify recurring themes. For each pattern, provide a title, a short description, and count how many times it appeared.
        3.  **Key Insights**: What are the most important "aha" moments or deep understandings gained?
        4.  **Action Items**: Suggest concrete, prioritized actions. For each, assign a priority (High, Medium, or Low) and a relevant product category (e.g., UI, Feature, Marketing).

        ${languageInstructions.en}
      `,
      ko: `
        다음을 분석하고 제공해주세요:
        1.  **요약**: 주요 결과에 대한 간략하고 높은 수준의 개요.
        2.  **주요 패턴**: 반복되는 주제를 식별합니다. 각 패턴에 대해 제목, 짧은 설명 및 나타난 횟수를 제공하세요.
        3.  **핵심 인사이트**: 가장 중요한 "아하" 순간이나 깊은 이해는 무엇이었나요?
        4.  **실행 항목**: 구체적이고 우선순위가 지정된 조치를 제안합니다. 각각에 대해 우선순위(높음, 중간, 낮음)와 관련 제품 카테고리(예: UI, 기능, 마케팅)를 할당하세요.

        ${languageInstructions.ko}
      `,
      am: `
        እባክዎ የሚከተሉትን ይተንትኑ እና ያቅርቡ፦
        1.  **ማጠቃለያ**: የቁልፍ ግኝቶች አጭር፣ ከፍተኛ-ደረጃ አጠቃላይ እይታ።
        2.  **ቁልፍ ቅጦች**: ተደጋጋሚ ገጽታዎችን ይለዩ። ለእያንዳንዱ ስርዓተ-ጥለት፣ ርዕስ፣ አጭር መግለጫ ያቅርቡ እና ስንት ጊዜ እንደታየ ይቁጠሩ።
        3.  **ቁልፍ ግንዛቤዎች**: በጣም አስፈላጊዎቹ "አሃ" አፍታዎች ወይም የተገኙ ጥልቅ ግንዛቤዎች ምንድን ናቸው?
        4.  **የድርጊት ንጥሎች**: ተጨባጭ፣ ቅድሚያ የሚሰጣቸው እርምጃዎችን ይጠቁሙ። ለእያንዳንዳቸው፣ ቅድሚያ (ከፍተኛ፣ መካከለኛ፣ ወይም ዝቅተኛ) እና ተዛማጅ የምርት ምድብ (ለምሳሌ፣ UI፣ ባህሪ፣ ግብይት) ይመድቡ።

        ${languageInstructions.am}
      `
    };

    if (isAudio) {
        const audioPrompts = {
          en: `You are an expert UX researcher analyzing a collection of user interview audio recordings. Your task is to listen to the recordings, synthesize the feedback, and extract meaningful patterns, insights, and actionable recommendations.
          The following parts are the audio recordings. ${analysisInstructions.en}`,
          ko: `당신은 사용자 인터뷰 오디오 녹음 모음을 분석하는 전문가 UX 연구원입니다. 당신의 임무는 녹음을 듣고, 피드백을 종합하며, 의미 있는 패턴, 인사이트 및 실행 가능한 권장 사항을 추출하는 것입니다.
          다음 부분은 오디오 녹음입니다. ${analysisInstructions.ko}`,
          am: `እርስዎ የተጠቃሚ ቃለ መጠይቅ የድምጽ ቅጂዎች ስብስብን የሚተነትኑ የባለሙያ UX ተመራማሪ ነዎት። የእርስዎ ተግባር ቅጂዎቹን ማዳመጥ፣ ግብረመልሱን ማቀናጀት እና ትርጉም ያላቸውን ቅጦች፣ ግንዛቤዎች እና ተግባራዊ ሊሆኑ የሚችሉ ምክሮችን ማውጣት ነው።
          የሚከተሉት ክፍሎች የድምጽ ቅጂዎች ናቸው። ${analysisInstructions.am}`
        }
        contentParts.push({ text: audioPrompts[language] });

        const audioRecords = records as { type: 'audio'; blob: Blob }[];
        const audioParts = await Promise.all(audioRecords.map(async (record) => {
            const base64Data = await blobToBase64(record.blob);
            return {
                inlineData: {
                    mimeType: record.blob.type,
                    data: base64Data,
                }
            };
        }));
        contentParts.push(...audioParts);
    } else {
        const transcripts = (records as { type: 'text'; content: string }[]).map(r => r.content);
        const textPrompts = {
            en: `You are an expert UX researcher analyzing a collection of user interview transcripts. Your task is to synthesize the feedback and extract meaningful patterns, insights, and actionable recommendations.
      
            Here are the interview transcripts:
            ---
            ${transcripts.join('\n---\n')}
            ---
            ${analysisInstructions.en}`,
            ko: `당신은 사용자 인터뷰 녹취록 모음을 분석하는 전문가 UX 연구원입니다. 당신의 임무는 피드백을 종합하고 의미 있는 패턴, 인사이트 및 실행 가능한 권장 사항을 추출하는 것입니다.
      
            다음은 인터뷰 녹취록입니다:
            ---
            ${transcripts.join('\n---\n')}
            ---
            ${analysisInstructions.ko}`,
            am: `እርስዎ የተጠቃሚ ቃለ መጠይቅ ትርጉሞች ስብስብን የሚተነትኑ የባለሙያ UX ተመራማሪ ነዎት። የእርስዎ ተግባር ግብረመልሱን ማቀናጀት እና ትርጉም ያላቸውን ቅጦች፣ ግንዛቤዎች እና ተግባራዊ ሊሆኑ የሚችሉ ምክሮችን ማውጣት ነው።
      
            የቃለ መጠይቁ ትርጉሞች እነሆ፦
            ---
            ${transcripts.join('\n---\n')}
            ---
            ${analysisInstructions.am}`
        }
        prompt = textPrompts[language];
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: isAudio ? { parts: contentParts } : prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: feedbackAnalysisSchema,
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as FeedbackAnalysisResult;
    } catch (error) {
        console.error('Error analyzing feedback:', error);
        throw new Error('Failed to analyze interview feedback.');
    }
};

// Generate composite image for 3-step sketch (single image with 3 panels)
export const generateThreeStepComposite = async (
  idea: BusinessIdea,
  language: keyof typeof languageInstructions,
  sketchStyle: 'simple' | 'professional' = 'simple'
): Promise<{ [key: string]: ThreeStepSketchComposite }> => {

  const styleInstructions = {
    simple: {
      en: "CHILD-LIKE DRAWING style - very simple, clumsy, wobbly lines, like a 5-8 year old child's drawing",
      ko: "어린이 그림 스타일 - 매우 단순하고 서툴고 삐뚤빼뚤한 선, 5-8살 어린이가 그린 것처럼",
      am: "የልጅ ስዕል ዘይቤ - በጣም ቀላል፣ ችኮላ፣ የተዳዳ መስመሮች፣ እንደ 5-8 ዓመት ልጅ ስዕል"
    },
    professional: {
      en: "HAND-DRAWN SKETCH style - professional illustration with clean lines and detailed shading",
      ko: "손그림 스케치 스타일 - 깔끔한 선과 세밀한 음영의 전문적인 일러스트레이션",
      am: "በእጅ የተሳለ ንድፍ ዘይቤ - ንጹህ መስመሮች እና ዝርዝር ጥላ ያለው ሙያዊ ምስል"
    }
  };

  const prompts = {
    en: `For the business idea "${idea.title}: ${idea.description}", create 3 distinct variations of a 3-step user flow sketch.

Each variation should show the key screens or interactions a user would have with the product/service. The three steps should represent the beginning, middle, and end of the user journey.

For each variation, provide:
1. Three step objects, each containing:
   - title: Short title for the UI screen/step
   - description: Scenario-based description with 3-4 bullet points focusing on WHAT THE USER DOES and WHY, not specific design details. IMPORTANT: Each bullet point MUST be on a NEW LINE separated by newline characters (\\n).

The output must be a JSON array containing 3 variations. Each variation is an object with a 'steps' array of 3 step objects.

${languageInstructions.en}`,
    ko: `비즈니스 아이디어 "${idea.title}: ${idea.description}"에 대해 3단계 사용자 흐름 스케치의 3가지 버전을 만드세요.

각 버전은 사용자가 제품/서비스와 가질 주요 화면이나 상호작용을 보여야 합니다. 세 단계는 사용자 여정의 시작, 중간, 끝을 나타내야 합니다.

각 버전에 대해:
1. 세 개의 단계 객체, 각각 포함:
   - title: UI 화면/단계의 짧은 제목
   - description: 특정 디자인 세부사항이 아닌 사용자가 무엇을 하고 왜 하는지에 초점을 맞춘 3-4개의 불렛 포인트가 있는 시나리오 기반 설명. 중요: 각 불렛 포인트는 줄바꿈 문자(\\n)로 구분된 새로운 줄에 있어야 합니다.

출력은 3개의 버전을 포함하는 JSON 배열이어야 합니다. 각 버전은 3개의 단계 객체 배열인 'steps'를 가진 객체입니다.

${languageInstructions.ko}`,
    am: `ለቢዝነስ ሀሳቡ "${idea.title}: ${idea.description}"፣ የ3-ደረጃ የተጠቃሚ ፍሰት ንድፍ 3 የተለያዩ ልዩነቶችን ይፍጠሩ።

እያንዳንዱ ልዩነት ተጠቃሚው ከምርቱ/አገልግሎቱ ጋር የሚኖረውን ቁልፍ ማያ ገጾች ወይም መስተጋብሮችን ማሳየት አለበት። ሦስቱ ደረጃዎች የተጠቃሚውን ጉዞ መጀመሪያ፣ መካከል እና መጨረሻ መወከል አለባቸው።

ለእያንዳንዱ ልዩነት፦
1. ሦስት የደረጃ ዕቃዎች፣ እያንዳንዱ የያዘው፦
   - title: ለ UI ማያ ገጽ/ደረጃ አጭር ርዕስ
   - description: ልዩ የዲዛይን ዝርዝሮች ሳይሆኑ ተጠቃሚው ምን እንደሚያደርግ እና ለምን እንደሆነ ላይ የሚያተኩር በ3-4 ነጥቦች ላይ የተመሰረተ መግለጫ። አስፈላጊ: እያንዳንዱ ነጥብ በመስመር መቁረጫ ቁምፊዎች (\\n) የተለየ አዲስ መስመር ላይ መሆን አለበት።

ውጤቱ 3 ልዩነቶችን የያዘ JSON ድርድር መሆን አለበት። እያንዳንዱ ልዩነት በ3 የደረጃ ዕቃዎች ድርድር 'steps' ያለው ዕቃ ነው።

${languageInstructions.am}`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompts[language],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    });

    const variations = JSON.parse(response.text.trim()) as { steps: { title: string; description: string }[] }[];

    const resultMap: { [key: string]: ThreeStepSketchComposite } = {};

    // Generate composite images for each variation
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];

      // Helper function to safely get first line of description
      const getFirstLine = (desc: string) => {
        if (!desc) return '';
        const lines = desc.split('\n');
        return lines[0] || desc.substring(0, 100);
      };

      const imagePrompts = {
        en: `Create a WEBTOON-STYLE 3-PANEL COMIC STRIP showing the user journey: "${idea.description}".

Style: ${styleInstructions[sketchStyle].en}

The image must show exactly 3 vertical panels arranged like a webtoon/comic:
Panel 1 (Top): ${variation.steps[0].title} - ${getFirstLine(variation.steps[0].description)}
Panel 2 (Middle): ${variation.steps[1].title} - ${getFirstLine(variation.steps[1].description)}
Panel 3 (Bottom): ${variation.steps[2].title} - ${getFirstLine(variation.steps[2].description)}

Important: Create ONE SINGLE IMAGE with all 3 panels arranged vertically like a webtoon. Each panel should be clearly separated with borders or space. Include panel numbers (1, 2, 3) in each panel.`,
        ko: `사용자 여정을 보여주는 웹툰 스타일 3패널 만화: "${idea.description}".

스타일: ${styleInstructions[sketchStyle].ko}

이미지는 웹툰/만화처럼 배열된 정확히 3개의 수직 패널을 보여야 합니다:
패널 1 (상단): ${variation.steps[0].title} - ${getFirstLine(variation.steps[0].description)}
패널 2 (중간): ${variation.steps[1].title} - ${getFirstLine(variation.steps[1].description)}
패널 3 (하단): ${variation.steps[2].title} - ${getFirstLine(variation.steps[2].description)}

중요: 웹툰처럼 3개의 패널이 모두 수직으로 배열된 하나의 단일 이미지를 만드세요. 각 패널은 테두리나 공간으로 명확하게 구분되어야 합니다. 각 패널에 패널 번호(1, 2, 3)를 포함하세요.`,
        am: `የተጠቃሚ ጉዞን የሚያሳይ የዌብቱን ዘይቤ 3-ፓነል ኮሚክ: "${idea.description}".

ዘይቤ: ${styleInstructions[sketchStyle].am}

ምስሉ እንደ ዌብቱን/ኮሚክ የተደረደሩ በትክክል 3 ቁመታዊ ፓነሎችን ማሳየት አለበት:
ፓነል 1 (ላይኛው): ${variation.steps[0].title} - ${getFirstLine(variation.steps[0].description)}
ፓነል 2 (መካከለኛ): ${variation.steps[1].title} - ${getFirstLine(variation.steps[1].description)}
ፓነል 3 (ታች): ${variation.steps[2].title} - ${getFirstLine(variation.steps[2].description)}

አስፈላጊ: እንደ ዌብቱን ሁሉም 3 ፓነሎች በቁመት የተደረደሩ አንድ ነጠላ ምስል ይፍጠሩ። እያንዳንዱ ፓነል በድንበሮች ወይም ቦታ በግልጽ መለየት አለበት። በእያንዳንዱ ፓነል ውስጥ የፓነል ቁጥሮች (1, 2, 3) ያካትቱ።`
      };

      try {
        const base64Url = await generateImage(imagePrompts[language]);
        resultMap[`v${i}`] = {
          compositeImageUrl: base64Url,
          steps: variation.steps
        };
      } catch (error) {
        console.error(`Error generating composite image for variation ${i}:`, error);
        resultMap[`v${i}`] = {
          compositeImageUrl: null,
          steps: variation.steps
        };
      }
    }

    return resultMap;
  } catch (error) {
    console.error('Error generating 3-step composite:', error);
    throw new Error('Failed to generate 3-step composite sketch.');
  }
};

// Generate composite image for storyboard (single image with 8 panels)
export const generateStoryboardComposite = async (
  idea: BusinessIdea,
  language: keyof typeof languageInstructions,
  customDescription?: string
): Promise<{ [key: string]: StoryboardComposite }> => {

  const prompts = {
    en: `Based on the business idea "${idea.title}: ${idea.description}", create ONE 8-panel storyboard that visualizes the customer's journey.

Provide 8 panel objects, each containing:
- title: Short, descriptive title for the panel (max 5 words)
- description: VERY DETAILED description with 5-8 bullet points explaining the scene, user emotions, actions, context, and key moments. IMPORTANT: Each bullet point MUST be on a NEW LINE separated by newline characters (\\n). Be specific and vivid in your descriptions.

The output must be a JSON array containing 1 variation. The variation is an object with a 'pages' array of 8 panel objects.

${languageInstructions.en}`,
    ko: `비즈니스 아이디어 "${idea.title}: ${idea.description}"를 바탕으로, 고객의 여정을 시각화하는 8패널 스토리보드 1개를 만드세요.

8개의 패널 객체 제공, 각각 포함:
- title: 짧고 설명적인 제목 (최대 5단어)
- description: 장면, 사용자 감정, 행동, 맥락, 주요 순간을 설명하는 5-8개의 불렛 포인트가 있는 매우 상세한 설명. 중요: 각 불렛 포인트는 줄바꿈 문자(\\n)로 구분된 새로운 줄에 있어야 합니다. 구체적이고 생생하게 설명하세요.

출력은 1개의 버전을 포함하는 JSON 배열이어야 합니다. 버전은 8개의 패널 객체 배열인 'pages'를 가진 객체입니다.

${languageInstructions.ko}`,
    am: `በቢዝነስ ሀሳብ "${idea.title}: ${idea.description}" ላይ በመመስረት፣ የደንበኛውን ጉዞ የሚያሳይ የ8-ፓነል ስቶሪቦርድ 1 ይፍጠሩ።

8 የፓነል ዕቃዎች ያቅርቡ፣ እያንዳንዱ የያዘው፦
- title: አጭር፣ ገላጭ ርዕስ (ከ5 ቃላት በታች)
- description: ትዕይንት፣ የተጠቃሚ ስሜቶች፣ ድርጊቶች፣ አውድ እና ቁልፍ ጊዜያትን የሚያብራራ በ5-8 ነጥቦች በጣም ዝርዝር መግለጫ። አስፈላጊ: እያንዳንዱ ነጥብ በመስመር መቁረጫ ቁምፊዎች (\\n) የተለየ አዲስ መስመር ላይ መሆን አለበት። ልዩ እና ግልጽ ይግለጹ።

ውጤቱ 1 ልዩነትን የያዘ JSON ድርድር መሆን አለበት። ልዩነቱ በ8 የፓነል ዕቃዎች ድርድር 'pages' ያለው ዕቃ ነው።

${languageInstructions.am}`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompts[language],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    });

    const variations = JSON.parse(response.text.trim()) as { pages: { title: string; description: string }[] }[];

    const resultMap: { [key: string]: StoryboardComposite } = {};

    // Helper function to safely get first line of description
    const getFirstLine = (desc: string) => {
      if (!desc) return '';
      const lines = desc.split('\n');
      return lines[0] || desc.substring(0, 100);
    };

    // Generate composite images for each variation
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];

      const imagePrompts = {
        en: `Create a LARGE WEBTOON-STYLE 8-PANEL STORYBOARD showing the customer journey: "${idea.description}".

Style: HAND-DRAWN SKETCH - simple pencil drawings like workshop storyboard frames

The image must show exactly 8 panels arranged in a 2x4 grid (2 columns, 4 rows) like a storyboard:
${variation.pages.map((page, idx) => `${page.title} - ${getFirstLine(page.description)}`).join('\n')}

Important:
- Create ONE SINGLE LARGE IMAGE with all 8 panels arranged in a grid
- DO NOT add numbers to the panels - just show the scenes
- Each panel should be separated with clear borders
- Keep the style consistent and simple across all panels
- Make the image large and clear`,
        ko: `고객 여정을 보여주는 큰 웹툰 스타일 8패널 스토리보드: "${idea.description}".

스타일: 손그림 스케치 - 워크샵 스토리보드 프레임처럼 간단한 연필 드로잉

이미지는 스토리보드처럼 2x4 그리드(2열, 4행)로 배열된 정확히 8개의 패널을 보여야 합니다:
${variation.pages.map((page, idx) => `${page.title} - ${getFirstLine(page.description)}`).join('\n')}

중요사항:
- 모든 8개의 패널이 그리드로 배열된 하나의 크고 단일한 이미지를 만드세요
- 패널에 번호를 추가하지 마세요 - 장면만 보여주세요
- 각 패널은 명확한 테두리로 구분되어야 합니다
- 모든 패널에서 일관되고 간단한 스타일을 유지하세요
- 이미지를 크고 선명하게 만드세요`,
        am: `የደንበኛ ጉዞን የሚያሳይ ትልቅ የዌብቱን ዘይቤ 8-ፓነል ስቶሪቦርድ: "${idea.description}".

ዘይቤ: በእጅ የተሳለ ንድፍ - እንደ ወርክሾፕ ስቶሪቦርድ ፍሬሞች ቀላል የእርሳስ ስዕሎች

ምስሉ እንደ ስቶሪቦርድ በ2x4 ግሪድ (2 አምዶች፣ 4 ረድፎች) የተደረደሩ በትክክል 8 ፓነሎችን ማሳየት አለበት:
${variation.pages.map((page, idx) => `${page.title} - ${getFirstLine(page.description)}`).join('\n')}

አስፈላጊ:
- ሁሉም 8 ፓነሎች በግሪድ የተደረደሩ አንድ ትልቅ ነጠላ ምስል ይፍጠሩ
- ቁጥሮችን ወደ ፓነሎች አያክሉ - ትዕይንቶችን ብቻ ያሳዩ
- እያንዳንዱ ፓነል በግልጽ ድንበሮች መለየት አለበት
- በሁሉም ፓነሎች ላይ ወጥ እና ቀላል ዘይቤ ያቆዩ
- ምስሉን ትልቅ እና ግልጽ ያድርጉት`
      };

      try {
        const base64Url = await generateImage(imagePrompts[language]);
        resultMap[`v${i}`] = {
          compositeImageUrl: base64Url,
          pages: variation.pages
        };
      } catch (error) {
        console.error(`Error generating composite storyboard for variation ${i}:`, error);
        resultMap[`v${i}`] = {
          compositeImageUrl: null,
          pages: variation.pages
        };
      }
    }

    return resultMap;
  } catch (error) {
    console.error('Error generating storyboard composite:', error);
    throw new Error('Failed to generate storyboard composite.');
  }
};