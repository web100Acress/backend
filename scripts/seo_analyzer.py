import sys
import json
import re
from bs4 import BeautifulSoup
import textstat
import yake
from rake_nltk import Rake

def analyze_seo(data):
    # Handle both string and dict input
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except:
            data = {}
    
    title = data.get('title', '')
    description = data.get('description', '')  # This is usually HTML from Quill
    meta_title = data.get('metaTitle', '')
    meta_description = data.get('metaDescription', '')
    slug = data.get('slug', '')
    content_html = data.get('content', '')
    focus_keyword = data.get('focusKeyword', '').lower().strip()
    
    # If no content, use description as fallback
    if not content_html and description:
        content_html = description

    # Use meta_title if available, otherwise title
    effective_title = meta_title if meta_title else title
    effective_description = meta_description if meta_description else ""

    # Basic text extraction from HTML
    soup = BeautifulSoup(content_html, 'html.parser')
    text_content = soup.get_text()
    words = text_content.split()
    word_count = len(words)
    
    # Initialize score
    total_score = 0
    max_score = 0
    
    # Focus Keyword Analysis
    keyword_score = 0
    keyword_checks = {
        "in_title": focus_keyword in effective_title.lower(),
        "in_meta_description": focus_keyword in effective_description.lower(),
        "in_url": focus_keyword in slug.lower(),
        "in_content": focus_keyword in text_content.lower(),
        "density": 0
    }
    
    if focus_keyword:
        # Calculate keyword density
        keyword_count = text_content.lower().count(focus_keyword)
        keyword_checks["density"] = round((keyword_count / word_count) * 100, 2) if word_count > 0 else 0
        
        # Score keyword checks
        if keyword_checks["in_title"]:
            keyword_score += 25
        if keyword_checks["in_meta_description"]:
            keyword_score += 25
        if keyword_checks["in_url"]:
            keyword_score += 15
        if keyword_checks["in_content"]:
            keyword_score += 25
        if 0.5 <= keyword_checks["density"] <= 2.5:
            keyword_score += 10
        max_score += 100
    
    # Readability Score
    readability_score = 0
    flesch_score = textstat.flesch_reading_ease(text_content) if text_content else 0
    if flesch_score >= 90:
        readability_score = 100
        readability_status = "Very Easy"
    elif flesch_score >= 80:
        readability_score = 90
        readability_status = "Easy"
    elif flesch_score >= 70:
        readability_score = 80
        readability_status = "Fairly Easy"
    elif flesch_score >= 60:
        readability_score = 70
        readability_status = "Standard"
    elif flesch_score >= 50:
        readability_score = 60
        readability_status = "Fairly Difficult"
    elif flesch_score >= 30:
        readability_score = 50
        readability_status = "Difficult"
    else:
        readability_score = 30
        readability_status = "Very Difficult"
    
    # Content Analysis
    content_score = 0
    if word_count >= 300:
        content_score += 40
    if word_count >= 600:
        content_score += 30
    if word_count >= 1000:
        content_score += 30
    max_score += 100
    
    # Paragraph Length Check
    paragraphs = soup.find_all('p')
    long_paragraphs = 0
    for p in paragraphs:
        para_text = p.get_text().strip()
        if len(para_text.split()) > 150:
            long_paragraphs += 1
    
    paragraph_score = 100
    if long_paragraphs > 0:
        paragraph_score = max(0, 100 - (long_paragraphs * 20))
    max_score += 100
    
    # H1 Validation
    h1_tags = soup.find_all('h1')
    h1_count = len(h1_tags)
    h1_score = 100 if h1_count == 1 else 0
    max_score += 100
    
    # Advanced Image SEO
    images = soup.find_all('img')
    images_with_alt = 0
    images_with_lazy = 0
    for img in images:
        if img.get('alt'):
            images_with_alt += 1
        if img.get('loading') == 'lazy':
            images_with_lazy += 1
    
    image_score = 0
    if images:
        alt_percentage = (images_with_alt / len(images)) * 100
        lazy_percentage = (images_with_lazy / len(images)) * 100
        image_score = (alt_percentage * 0.7) + (lazy_percentage * 0.3)
    max_score += 100
    
    # Internal Link Suggestion
    links = soup.find_all('a')
    internal_links = 0
    for link in links:
        href = link.get('href', '')
        if href and not href.startswith('http') or '100acress.com' in href:
            internal_links += 1
    
    link_score = 0
    if 3 <= internal_links <= 5:
        link_score = 100
    elif 1 <= internal_links <= 2:
        link_score = 70
    elif internal_links >= 6:
        link_score = 80
    else:
        link_score = 0
    max_score += 100
    
    # Schema Detection
    schema_found = False
    schema_types = []
    scripts = soup.find_all('script', type='application/ld+json')
    for script in scripts:
        try:
            schema_data = json.loads(script.string)
            if isinstance(schema_data, dict):
                if '@type' in schema_data:
                    schema_found = True
                    schema_types.append(schema_data['@type'])
            elif isinstance(schema_data, list):
                for item in schema_data:
                    if isinstance(item, dict) and '@type' in item:
                        schema_found = True
                        schema_types.append(item['@type'])
        except:
            pass
    
    schema_score = 100 if schema_found else 0
    max_score += 100
    
    # LSI Keywords Extraction
    lsi_keywords = []
    try:
        # Using YAKE for keyword extraction
        kw_extractor = yake.KeywordExtractor(lan="en", n=3, dedupLim=0.7, top=10, features=None)
        keywords = kw_extractor.extract_keywords(text_content)
        lsi_keywords = [kw[0] for kw in keywords]  # YAKE returns (keyword, score), so keyword is at index 0
    except:
        try:
            # Fallback to RAKE
            r = Rake()
            r.extract_keywords_from_text(text_content)
            lsi_keywords = r.get_ranked_phrases()[:10]
        except:
            lsi_keywords = []
    
    # Content Structure Analysis
    lists = soup.find_all(['ul', 'ol'])
    tables = soup.find_all('table')
    blockquotes = soup.find_all('blockquote')
    
    structure_score = 0
    if len(lists) >= 2:
        structure_score += 30
    if len(tables) >= 1:
        structure_score += 30
    if len(blockquotes) >= 1:
        structure_score += 20
    if word_count >= 1000:
        structure_score += 20
    max_score += 100
    
    # Keyword Position Analysis
    first_paragraph = soup.find('p')
    first_para_has_keyword = False
    if first_paragraph:
        first_para_has_keyword = focus_keyword in first_paragraph.get_text().lower()
    
    h2_headings = soup.find_all('h2')
    h2_has_keyword = any(focus_keyword in h.get_text().lower() for h in h2_headings)
    
    img_with_keyword_alt = 0
    for img in images:
        alt = img.get('alt', '').lower()
        if focus_keyword in alt:
            img_with_keyword_alt += 1
    
    position_score = 0
    if first_para_has_keyword:
        position_score += 30
    if h2_has_keyword:
        position_score += 40
    if img_with_keyword_alt > 0:
        position_score += 30
    max_score += 100
    
    # OpenGraph and Social Media Tags
    meta_tags = soup.find_all('meta', attrs={'property': True}) + soup.find_all('meta', attrs={'name': True})
    og_title = any(m.get('property') == 'og:title' for m in meta_tags)
    og_description = any(m.get('property') == 'og:description' for m in meta_tags)
    og_image = any(m.get('property') == 'og:image' for m in meta_tags)
    twitter_card = any(m.get('name') == 'twitter:card' for m in meta_tags)
    twitter_title = any(m.get('name') == 'twitter:title' for m in meta_tags)
    
    social_score = 0
    if og_title:
        social_score += 20
    if og_description:
        social_score += 20
    if og_image:
        social_score += 20
    if twitter_card:
        social_score += 20
    if twitter_title:
        social_score += 20
    max_score += 100
    
    # Internal Linking Suggestions (Real Estate Specific)
    suggested_links = []
    if focus_keyword:
        real_estate_keywords = {
            'dubai': ['/blog/dubai-property-guide', '/blog/best-areas-in-dubai'],
            'property': ['/blog/property-investment-tips', '/blog/real-estate-guide'],
            'investment': ['/blog/real-estate-investment-dubai', '/blog/property-investment-2024'],
            'apartment': ['/blog/luxury-apartments-dubai', '/blog/apartment-buying-guide'],
            'villa': ['/blog/dubai-villas', '/blog/luxury-villas-for-sale'],
            'real estate': ['/blog/dubai-real-estate', '/blog/real-estate-market-trends']
        }
        
        for keyword, links in real_estate_keywords.items():
            if keyword in focus_keyword:
                suggested_links.extend(links)
                break
    
    # Competitor Benchmark (Mock data for now)
    competitor_benchmark = {
        "avgWordCount": 1800,
        "yourWordCount": word_count,
        "status": "success" if word_count >= 1500 else "warning" if word_count >= 1000 else "error",
        "suggestion": "Good content depth" if word_count >= 1500 else "Consider adding more content" if word_count >= 1000 else "Content is too short compared to competitors"
    }
    
    # Calculate overall score (updated with new metrics)
    total_score = keyword_score + readability_score + content_score + paragraph_score + h1_score + image_score + link_score + schema_score + structure_score + position_score + social_score
    overall_score = round((total_score / max_score) * 100) if max_score > 0 else 0
    
    results = {
        "overall_score": overall_score,
        "focus_keyword": {
            "keyword": focus_keyword,
            "checks": keyword_checks,
            "score": keyword_score
        },
        "readability": {
            "flesch_score": round(flesch_score, 1),
            "status": readability_status,
            "score": readability_score
        },
        "lsi_keywords": lsi_keywords[:8],  # Top 8 LSI keywords
        "content_structure": {
            "lists": len(lists),
            "tables": len(tables),
            "quotes": len(blockquotes),
            "score": structure_score,
            "status": "success" if structure_score >= 70 else "warning" if structure_score >= 40 else "error"
        },
        "keyword_position": {
            "firstParagraph": first_para_has_keyword,
            "h2Headings": h2_has_keyword,
            "imageAlt": img_with_keyword_alt > 0,
            "imageAltCount": img_with_keyword_alt,
            "score": position_score,
            "status": "success" if position_score >= 70 else "warning" if position_score >= 40 else "error"
        },
        "social_tags": {
            "ogTitle": og_title,
            "ogDescription": og_description,
            "ogImage": og_image,
            "twitterCard": twitter_card,
            "twitterTitle": twitter_title,
            "score": social_score,
            "status": "success" if social_score >= 80 else "warning" if social_score >= 40 else "error"
        },
        "internal_link_suggestions": suggested_links[:5],  # Top 5 suggestions
        "competitor_benchmark": competitor_benchmark,
        "overview": {
            "title": {
                "value": effective_title,
                "length": len(effective_title),
                "status": "success" if 30 <= len(effective_title) <= 60 else "error",
                "message": f"{len(effective_title)} characters"
            },
            "description": {
                "value": effective_description,
                "length": len(effective_description),
                "status": "success" if 120 <= len(effective_description) <= 160 else "error",
                "message": f"{len(effective_description)} characters"
            },
            "url": {
                "value": f"https://www.100acress.com/blog/{slug}/",
                "status": "success" if slug else "error",
                "message": "Indexable" if slug else "Missing Slug"
            },
            "canonical": {
                "value": f"https://www.100acress.com/blog/{slug}/",
                "status": "success",
                "message": "Canonicalised"
            }
        },
        "headings": [],
        "h1_validation": {
            "count": h1_count,
            "status": "success" if h1_count == 1 else "error",
            "message": f"{h1_count} H1 tag(s) found" + (" (should be exactly 1)" if h1_count != 1 else ""),
            "score": h1_score
        },
        "content": {
            "wordCount": word_count,
            "status": "success" if word_count >= 300 else "warning",
            "score": content_score
        },
        "paragraphs": {
            "total": len(paragraphs),
            "long_paragraphs": long_paragraphs,
            "status": "success" if long_paragraphs == 0 else "warning",
            "message": f"{long_paragraphs} paragraph(s) too long (>150 words)",
            "score": paragraph_score
        },
        "links": {
            "internal": internal_links,
            "external": len(links) - internal_links,
            "total": len(links),
            "status": "success" if 3 <= internal_links <= 5 else "warning",
            "message": f"{internal_links} internal link(s) (recommended: 3-5)",
            "list": []
        },
        "images": {
            "total": len(images),
            "with_alt": images_with_alt,
            "with_lazy": images_with_lazy,
            "missing_alt": len(images) - images_with_alt,
            "status": "success" if len(images) == 0 or images_with_alt == len(images) else "warning",
            "message": f"{images_with_alt}/{len(images)} images have alt text",
            "score": round(image_score, 1)
        },
        "schema": {
            "found": schema_found,
            "types": schema_types,
            "status": "success" if schema_found else "warning",
            "message": f"Schema markup: {'Found (' + ', '.join(schema_types) + ')' if schema_found else 'Not found'}",
            "score": schema_score
        }
    }

    # Headings Analysis
    for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
        headings = soup.find_all(tag)
        for h in headings:
            results["headings"].append({
                "type": tag.upper(),
                "text": h.get_text().strip()
            })

    # Links Analysis (detailed list)
    # Re-fetch links to ensure we have BeautifulSoup objects
    fresh_links = soup.find_all('a')
    for link in fresh_links:
        href = link.get('href', '')
        is_external = href.startswith('http') and '100acress.com' not in href
        
        results["links"]["list"].append({
            "text": link.get_text().strip(),
            "href": href,
            "type": "External" if is_external else "Internal"
        })

    # Images Analysis (detailed list)
    results["images"]["list"] = []
    for img in images:
        alt = img.get('alt', '')
        results["images"]["list"].append({
            "src": img.get('src', ''),
            "alt": alt if alt else "MISSING",
            "lazy": img.get('loading') == 'lazy'
        })

    return results

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        analysis = analyze_seo(input_data)
        print(json.dumps(analysis))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
