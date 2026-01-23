
import json
from lxml import etree
import json
from lxml import etree
from datetime import datetime

# from automation.kaspi.modules.creator import prepare_card_payload
# from automation.kaspi.modules.category_mapper import get_category_attributes

SKU = "472069784"
NEW_SKU = "472069784-K"
BARCODE_PREFIX = "201"

def generate_xml():
    # 1. Reuse existing payload logic to get attributes
    # We will mock the 'scraped_data' by reusing the logic from create_from_wb?
    # Actually, simpler: just manually construct the payload known to be good.
    # We know the attributes from previous successful (but invisible) uploads.
    
    attributes = [
        {"code": "Stuffed toys*Type", "value": "Мягкая игрушка"},
        {"code": "Stuffed toys*Height", "value": 35},
        {"code": "Stuffed toys*Filler", "value": "Синтепон"},
        {"code": "Stuffed toys*Character", "value": "Стич"},
        {"code": "Stuffed toys*View", "value": "Животные"},
        {"code": "Toys*Age", "value": "От 3 лет"},
        {"code": "Toys*Gender", "value": "Унисекс"},
        {"code": "Toys*Color", "value": "Синий"},
        {"code": "Toys*Material", "value": "Текстиль"}
    ]
    
    # XML Construction
    # Root
    root = etree.Element("kaspi_catalog", 
                         date=datetime.now().strftime("%Y-%m-%d %H:%M"),
                         xmlns="kaspiShopping",
                         nsmap={"xsi": "http://www.w3.org/2001/XMLSchema-instance"})
    
    company = etree.SubElement(root, "company")
    company.text = "MoySklad Integration" # Arbitrary string
    
    merchantid = etree.SubElement(root, "merchantid")
    merchantid.text = "GrandO" # Arbitrary
    
    offers = etree.SubElement(root, "offers")
    
    offer = etree.SubElement(offers, "offer", sku=NEW_SKU)
    
    model = etree.SubElement(offer, "model")
    model.text = "Мягкая игрушка Стич 35см"
    
    brand = etree.SubElement(offer, "brand")
    brand.text = "Generic"
    
    # Attributes
    avail = etree.SubElement(offer, "availabilities")
    # Usually manual import doesn't require availabilities, but strict XML might.
    # We'll skip availabilities for "New Product Creation" focus.
    
    price = etree.SubElement(offer, "price") # Optional for content, but good to have
    price.text = "3999"
    
    cat_code = etree.SubElement(offer, "category")
    cat_code.text = "Master - Stuffed toys"
    cat_code.set("code", "Master - Stuffed toys") # Try both
    
    # Encode attributes
    # Convert list of dicts to <param name="Code" code="Code">Value</param>
    # Note: 'name' is human readable, 'code' is machine. 
    # Since we only have 'code', we will use 'code' for both or guess name?
    # Actually Kaspi usually ignores 'name' if 'code' is present.
    
    for attr in attributes:
        # Extract last part of code as name for readability
        readable_name = attr['code'].split('*')[-1]
        p = etree.SubElement(offer, "param", name=readable_name, code=attr['code'])
        p.text = str(attr['value'])
        
    # Images
    images = etree.SubElement(offer, "images")
    img = etree.SubElement(images, "image")
    img.text = "https://ir.ozone.ru/s3/multimedia-q/wc1000/608707482.jpg"
    
    # Title/Description
    title = etree.SubElement(offer, "title")
    title.text = "Мягкая игрушка Стич 35см"
    
    desc = etree.SubElement(offer, "description")
    desc.text = "Качественная мягкая игрушка Стич, высота 35 см. Гипоаллергенный наполнитель."
    
    # Write to file
    tree = etree.ElementTree(root)
    output_path = "kaspi_upload_manual.xml"
    tree.write(output_path, pretty_print=True, xml_declaration=True, encoding="UTF-8")
    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_xml()
