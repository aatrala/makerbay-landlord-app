import OpenAI from "openai";

// Maintenance categories for classification
const MAINTENANCE_CATEGORIES = [
  "plumbing",
  "electrical",
  "hvac",
  "appliance",
  "structural",
  "pest_control",
  "landscaping",
  "cosmetic",
  "safety",
  "other",
] as const;

const PRIORITY_LEVELS = ["emergency", "urgent", "routine"] as const;

interface TriageInput {
  title: string;
  description: string;
  photos?: string[];
}

interface TriageResult {
  category: string;
  priority: string;
  confidence: number;
  estimatedCost: number | null;
  recommendedAction: string;
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * AI-powered maintenance triage using OpenAI.
 * Categorizes the request, scores priority, estimates cost, and suggests action.
 */
export async function triageMaintenanceRequest(
  input: TriageInput,
): Promise<TriageResult> {
  const client = getOpenAIClient();

  if (!client) {
    // Fallback to rule-based triage when no API key
    return ruleBasedTriage(input);
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a property maintenance triage AI. Analyze the maintenance request and respond with ONLY a JSON object (no markdown, no explanation).

The JSON must have these exact fields:
- "category": one of [${MAINTENANCE_CATEGORIES.join(", ")}]
- "priority": one of [${PRIORITY_LEVELS.join(", ")}]
  - "emergency": immediate danger to property or occupants (flood, fire, gas leak, no heat in winter)
  - "urgent": significant inconvenience or potential for damage if not addressed within 24h (leaking faucet, broken lock, no hot water)
  - "routine": cosmetic or non-urgent issues (dripping faucet, cracked tile, squeaky door)
- "confidence": a number 0-1 representing your confidence in the categorization
- "estimatedCost": estimated repair cost in USD (number or null if unable to estimate)
- "recommendedAction": brief one-line action description for the landlord

Be conservative with emergency classification. Only classify as emergency when there is immediate risk.`,
        },
        {
          role: "user",
          content: `Title: ${input.title}\nDescription: ${input.description}${input.photos?.length ? `\nPhotos: ${input.photos.length} attached` : ""}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty AI response");

    const result = JSON.parse(content) as TriageResult;

    // Validate the result
    if (!MAINTENANCE_CATEGORIES.includes(result.category as any)) {
      result.category = "other";
    }
    if (!PRIORITY_LEVELS.includes(result.priority as any)) {
      result.priority = "routine";
    }
    if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
      result.confidence = 0.5;
    }

    return result;
  } catch (error) {
    console.error("[AI Triage] OpenAI error, falling back to rules:", error);
    return ruleBasedTriage(input);
  }
}

/**
 * Rule-based fallback triage when AI is unavailable.
 * Uses keyword matching to categorize and prioritize.
 */
function ruleBasedTriage(input: TriageInput): TriageResult {
  const text = `${input.title} ${input.description}`.toLowerCase();

  // Category detection via keywords
  const categoryKeywords: Record<string, string[]> = {
    plumbing: ["leak", "pipe", "drain", "toilet", "faucet", "water", "sink", "shower", "bathtub", "clog", "sewage"],
    electrical: ["electric", "outlet", "switch", "breaker", "wire", "light", "power", "spark", "socket"],
    hvac: ["heat", "ac", "air conditioning", "furnace", "thermostat", "vent", "duct", "cooling", "no heat"],
    appliance: ["stove", "oven", "dishwasher", "refrigerator", "fridge", "microwave", "dryer", "washer", "garbage disposal"],
    structural: ["wall", "floor", "ceiling", "roof", "door", "window", "crack", "hole", "broken"],
    pest_control: ["pest", "bug", "rat", "mouse", "roach", "ant", "spider", "wasp", "termite", "bed bug"],
    landscaping: ["yard", "lawn", "tree", "bush", "fence", "garden", "grass", "hedge"],
    cosmetic: ["paint", "stain", "scratch", "dent", "carpet", "tile", "grout", "caulk"],
    safety: ["smoke", "detector", "lock", "deadbolt", "carbon monoxide", "fire", "mold", "asbestos"],
  };

  let category = "other";
  let maxMatches = 0;
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter((kw) => text.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      category = cat;
    }
  }

  // Priority detection
  const emergencyKeywords = ["flood", "fire", "gas", "spark", "no heat", "burst", "collapse", "sewage", "carbon monoxide"];
  const urgentKeywords = ["leak", "broken", "no hot water", "lock", "stuck", "won't work", "not working"];

  let priority: string = "routine";
  if (emergencyKeywords.some((kw) => text.includes(kw))) {
    priority = "emergency";
  } else if (urgentKeywords.some((kw) => text.includes(kw))) {
    priority = "urgent";
  }

  // Cost estimation by category
  const costEstimates: Record<string, number> = {
    plumbing: 200,
    electrical: 250,
    hvac: 300,
    appliance: 180,
    structural: 400,
    pest_control: 150,
    landscaping: 100,
    cosmetic: 120,
    safety: 200,
    other: 150,
  };

  const confidence = maxMatches > 0 ? Math.min(0.5 + maxMatches * 0.15, 0.85) : 0.4;

  return {
    category,
    priority,
    confidence,
    estimatedCost: costEstimates[category] || 150,
    recommendedAction: `Schedule ${category} inspection. Priority: ${priority}.`,
  };
}

/**
 * Find the best matching vendor for a maintenance category from the landlord's vendor list.
 */
export function findBestVendor(
  vendors: Array<{ id: string; trade: string; name: string }>,
  category: string,
): string | null {
  // Map maintenance categories to vendor trades
  const categoryToTrade: Record<string, string[]> = {
    plumbing: ["plumber", "plumbing"],
    electrical: ["electrician", "electrical"],
    hvac: ["hvac", "heating", "cooling", "air conditioning"],
    appliance: ["appliance", "repair", "handyman"],
    structural: ["contractor", "carpenter", "handyman", "construction"],
    pest_control: ["pest", "exterminator", "pest control"],
    landscaping: ["landscaping", "lawn", "gardening", "landscape"],
    cosmetic: ["painter", "handyman", "contractor"],
    safety: ["locksmith", "electrician", "handyman", "safety"],
    other: ["handyman", "contractor", "maintenance"],
  };

  const matchingTrades = categoryToTrade[category] || ["handyman"];

  const match = vendors.find((v) =>
    matchingTrades.some((trade) => v.trade.toLowerCase().includes(trade)),
  );

  return match?.id || null;
}
