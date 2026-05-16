/**
 * CHISA AI Engine - Grounded Prompt Processing
 * Powering Voice-to-Diagnosis and Multi-Sectoral Thresholds
 */

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // Replace with your secure key
const GEMINI_MODEL = "gemini-1.5-flash"; // Optimized for speed and low-latency last-mile tasks

function callChisaEngine(systemInstruction, userTranscript) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    "contents": [
      {
        "parts": [{ "text": userTranscript }]
      }
    ],
    "systemInstruction": {
      "parts": [{ "text": systemInstruction }]
    },
    "generationConfig": {
      "temperature": 0.1, // Set ultra-low to enforce deterministic adherence to guidelines
      "responseMimeType": "application/json"
    }
  };
  
  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    // Extract the text response block which contains our JSON string
    const resultText = json.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);
  } catch (e) {
    Logger.log("CHISA Engine Error: " + e.toString());
    return { "error": true, "message": "Failed to parse clinical tokens." };
  }
}

const CLINICAL_ASSESSMENT_SYSTEM_PROMPT = `
You are the Clinical Core of CHISA, an expert AI assistant grounded strictly in WHO and Ministry of Health iCCM/IMCI guidelines. Your task is to analyze raw text transcripts spoken by a Community Health Worker and extract precise nutritional tokens.

Analyze the text for:
1. Pitting Oedema: Must be classified as 'None', 'Grade 1' (both feet), 'Grade 2' (feet, lower legs, hands/arms), or 'Grade 3' (generalized/anasarca).
2. MUAC Metric: Extract numeric value in centimeters if mentioned.
3. Severe Wasting Signs: Look for explicit descriptions like 'baggy pants appearance', 'loose skin on buttocks', or 'old man face'.
4. Classification: Determine if the child meets the criteria for Severe Acute Malnutrition (SAM), Moderate Acute Malnutrition (MAM), or No Acute Malnutrition.

You must return EXACTLY this JSON structure and nothing else:
{
  "pitting_oedema_detected": true/false,
  "oedema_grade": "None/Grade 1/Grade 2/Grade 3",
  "muac_cm": float or null,
  "severe_wasting_signs": ["list", "of", "signs"] or [],
  "clinical_classification": "SAM/MAM/Normal",
  "immediate_action_required": true/false,
  "rationale": "Short clinical reason grounding this output in iCCM guidelines."
}
`;

const CHILD_PROTECTION_SYSTEM_PROMPT = `
You are the Safeguarding Core of CHISA, operating under national child welfare legislation and child protection protocols. Your objective is to analyze a worker's field notes or voice transcripts to identify indicators of physical trauma, abuse, or structural neglect.

Analyze the text for:
1. Patterned Bruises/Scarring: Look for suspicious injury markers (e.g., loop marks, linear bruises, cigarette burns, or bilateral bruising at different healing stages).
2. Elevated Distress: Note indications of highly erratic respiratory patterns or extreme behavioral withdrawal/fear during testing.
3. Educational Truancy: Cross-reference child's age against school attendance. If school-aged but not attending despite free education mandates, flag as Potential Structural Neglect.

You must return EXACTLY this JSON structure and nothing else:
{
  "trauma_indicators_detected": true/false,
  "injury_types": ["patterned bruises", "unexplained scars"] or [],
  "educational_truancy_flag": true/false,
  "safeguarding_risk_level": "Low/Medium/Critical",
  "welfare_officer_referral_required": true/false,
  "safeguarding_notes": "Objective architectural summary of protection risks detected."
}
`;

const WASH_INTEGRATION_SYSTEM_PROMPT = `
You are the Environmental Health Linkage Core of CHISA. Your job is to process clinical case notes, track water-borne symptoms, and identify structural environmental triggers.

Analyze the text for:
1. Active Diarrhea: Verify if current case includes severe watery stools.
2. Caregiver Audit: Extract notes on local water sources (e.g., 'borehole has brown water', 'pump broken for a week', 'shallow well flooding').
3. Threshold Telemetry Flag: If the text indicates an outbreak or multiple households affected, flag for immediate infrastructure tracking.

You must return EXACTLY this JSON structure and nothing else:
{
  "active_diarrhea_confirmed": true/false,
  "wash_infrastructure_compromised": true/false,
  "water_source_type": "Borehole/Shallow Well/River/Tap/Unknown",
  "infrastructure_anomaly_description": "Text summary of what is broken or contaminated" or null,
  "trigger_mwater_ticket": true/false,
  "alert_payload": {
    "severity": "Routine/Emergency",
    "target_channels": ["mWater", "Ministry of Water Development"]
  }
}
`;

function runChisaDiagnosticTest() {
  // Simulated raw transcript coming from a CHW's voice input in the field
  const mockVoiceTranscript = "The child is 4 years old. Caregiver reports severe watery diarrhea for 4 days. When I checked the feet, there is clear swelling on both feet that leaves a deep pit when pressed. MUAC tape is showing 11.2 centimeters. Caregiver mentioned they are getting water from the main village borehole but the water has looked cloudy and brown since the flash flood on Tuesday.";
  
  // 1. Run the Clinical Prompt
  const clinicalResult = callChisaEngine(CLINICAL_ASSESSMENT_SYSTEM_PROMPT, mockVoiceTranscript);
  Logger.log("--- CLINICAL OUTCOME ---");
  Logger.log(JSON.stringify(clinicalResult, null, 2));
  
  // 2. Run the WASH Integration Prompt
  const washResult = callChisaEngine(WASH_INTEGRATION_SYSTEM_PROMPT, mockVoiceTranscript);
  Logger.log("--- WASH INFRASTRUCTURE OUTCOME ---");
  Logger.log(JSON.stringify(washResult, null, 2));
  
  // If the AI confirms the WASH infrastructure is broken, trigger your AppSheet webhook or mWater API here!
  if (washResult.trigger_mwater_ticket) {
    Logger.log("CRITICAL: Sending automated repair ticket to mWater API for cloudy/flooded borehole!");
    // Your UrlFetchApp logic to mWater endpoints goes here
  }
}
