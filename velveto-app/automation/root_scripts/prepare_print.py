
import os

html_path = 'usbis_v14_export/index.html'
output_path = 'usbis_v14_export/print_version.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Inject print styles
style = """
<style>
    @media print {
        @page {
            size: 1600px 900px;
            margin: 0;
        }
        body { 
            height: auto !important; 
            overflow: visible !important; 
            background: white !important;
            display: block !important;
        }
        .presentation-container { 
            width: 100% !important; 
            height: auto !important; 
            box-shadow: none !important;
            display: block !important;
        }
        .slide { 
            position: relative !important; 
            top: auto !important;
            left: auto !important;
            width: 100% !important;
            height: 900px !important; /* Fixed height for consistency */
            opacity: 1 !important; 
            visibility: visible !important; 
            page-break-after: always !important; 
            display: flex !important;
            border-bottom: 1px solid #eee; /* Separator for screen view */
        }
        .header, .footer, .nav-btn { 
            display: none !important; 
        }
        /* Ensure background colors print */
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
    }
</style>
"""

# Insert style before </head>
new_content = content.replace('</head>', style + '\n</head>')

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Created {output_path}")
