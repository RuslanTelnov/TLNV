import os
import json
from dotenv import load_dotenv
from supabase import create_client
import google.generativeai as genai

def analyze_reviews():
    load_dotenv('.env')
    load_dotenv('temp_tlnv_parser/velveto-app/.env.local')
    
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    api_key = os.environ.get("OPENAI_API_KEY") # Or Gemini key, assuming project uses it
    
    if not url or not key:
        print("Missing Supabase credentials")
        return

    # Use Gemini directly if possible, or via OpenAI wrapper if project is set up that way
    # Based on instructions, I should use Gemini for AI tasks.
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro')

    supabase = create_client(url, key)
    
    # Fetch unanalyzed reviews
    res = supabase.table('market_reviews').select('*').eq('is_analyzed', False).limit(10).execute()
    reviews = res.data
    
    if not reviews:
        print("No new reviews to analyze.")
        return

    for rev in reviews:
        print(f"Analyzing review {rev['id']}...")
        text = rev.get('text', '')
        pros = rev.get('pros', '')
        cons = rev.get('cons', '')
        
        prompt = f"""
        Analyze the following marketplace review:
        Full Text: {text}
        Pros: {pros}
        Cons: {cons}
        
        Provide the result in JSON format with the following keys:
        - sentiment: 'positive', 'negative', or 'neutral'
        - category: One of 'Quality', 'Packaging', 'Logistics', 'Price', 'Description Match', 'Other'
        - pain_points: A list of specific complaints or issues mentioned.
        
        Return ONLY valid JSON.
        """
        
        try:
            response = model.generate_content(prompt)
            # Find the JSON part in the response
            content = response.text
            start = content.find('{')
            end = content.rfind('}') + 1
            analysis = json.loads(content[start:end])
            
            # Update record
            supabase.table('market_reviews').update({
                "sentiment": analysis.get('sentiment'),
                "category": analysis.get('category'),
                "pain_points": analysis.get('pain_points'),
                "is_analyzed": True
            }).eq('id', rev['id']).execute()
            print(f"✅ Successfully analyzed {rev['id']}")
            
        except Exception as e:
            print(f"❌ Error analyzing review {rev['id']}: {e}")

if __name__ == "__main__":
    analyze_reviews()
