import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

mapping = {
    'CAD-AXV-120': 'cadivi-axv-120.jpg',
    'CAD-CV-1.0': 'cadivi-cv-1-0.jpg',
    'CAD-CV-1.25': 'cadivi-cv-1-25.jpg',
    'CAD-CV-1.5': 'cadivi-cv-1-5.jpg',
    'CAD-CV-2.0': 'cadivi-cv-2-0.jpg',
    'CAD-CV-2.5': 'cadivi-cv-2-5.jpg',
    'CAD-CV-3.5': 'cadivi-cv-3-5.jpg',
    'CAD-CV-4.0': 'cadivi-cv-4-0.jpg',
    'CAD-CV-5.5': 'cadivi-cv-5-5.jpg',
    'CAD-CV-6.0': 'cadivi-cv-6-0.jpg',
    'CAD-CV-8.0': 'cadivi-cv-8-0.jpg',
    'CAD-CV-10.0': 'cadivi-cv-10-0.jpg',
    'CAD-CV-120': 'cadivi-cv-120.jpg',
    'CAD-CVV-4X120': 'cadivi-cvv-4x120.jpg',
    'CAD-CXV-120': 'cadivi-cxv-120.jpg',
    'CAD-CXV-3X120': 'cadivi-cxv-3x120.jpg',
    'CAD-LVABC-2X120': 'cadivi-lvabc-2x120.jpg',
    'CAD-LVABC-4X120': 'cadivi-lvabc-4x120.jpg',
    'CAD-VCM-120-B': 'cadivi-vcm-120-b.jpg',
    'CAD-VCMD-2X05': 'cadivi-vcmd-2x05.jpg',
    'SCH-M3T01-WE': 'schneider-avataron-m3t01-we.jpg',
    'SCH-M3T01BP-WE': 'schneider-avataron-m3t01bp-we.jpg',
    'SCH-M3T01MCB-WE': 'schneider-avataron-m3t01mcb-we.jpg',
    'SCH-M3T02-WE': 'schneider-avataron-m3t02-we.jpg',
    'SCH-M3T02MCB-WE': 'schneider-avataron-m3t02mcb-we.jpg',
    'SCH-M3T03-WE': 'schneider-avataron-m3t03-we.jpg',
    'SCH-M3T31-1F-WE': 'schneider-avataron-m3t31-1f-we.jpg',
    'SCH-M3T31-2-WE': 'schneider-avataron-m3t31-2-we.jpg',
    'SCH-M3T31-D20N-WE': 'schneider-avataron-m3t31-d20n-we.jpg',
    'SCH-M3T31-M1F-WE': 'schneider-avataron-m3t31-m1f-we.jpg',
    'SCH-M3T31-M2-WE': 'schneider-avataron-m3t31-m2-we.jpg',
    'SCH-EZ9F34116': 'schneider-easy9-cuc-noi.jpg',
    'SCH-EZ9F34232': 'schneider-easy9-2p.jpg',
    'SCH-EZC100H1100': 'schneider-mcb-1.jpg',
    'SCH-EZC630H4500N': 'schneider-avataron-mcb.jpg',
    'SCH-EZC630H4600N': 'schneider-avataron-mat-sau.jpg',
    'PA-MCB-2P32': 'panasonic-mcb-2p32.jpg',
    'PAN-GP-10HCN1SVN': 'panasonic-gp-10hcn1svn.png',
    'PAN-GP-15HCN1SVN': 'panasonic-gp-15hcn1svn.png',
    'PAN-GP-20HCN1SVN': 'panasonic-gp-20hcn1svn.png',
    'PAN-GP129JXK-NV5': 'panasonic-gp129jxk-nv5.png',
    'PAN-GP129JXK-SV5': 'panasonic-gp129jxk-sv5.png',
    'ZN-DN20': 'zenner-dn20.jpg',
    'LED-PHA-10W': 'rangdong-led-pha-10w.jpg',
    'LED-PHA-20W': 'rangdong-led-pha-20w.jpg',
    'LED-PHA-30W': 'rangdong-led-pha-cp07.jpg',
    'LED-PHA-50W': 'led-pha-1.jpg',
    'LED-PHA-100W': 'rangdong-led-pha-cp10.jpg',
    'LED-PHA-150W': 'led-pha-2.jpg',
    'LED-PHA-200W': 'rangdong-led-pha-cp12.jpg',
    'LED-SIP-30W': 'rangdong-led-sip-30w.jpg',
    'LED-SIP-50W': 'rangdong-led-sip-50w.jpg',
    'LED-SIP-100W': 'rangdong-led-sip-100w.jpg',
    'LED-SIP-150W': 'rangdong-led-sip-150w.jpg',
    'LED-SIP-200W': 'rangdong-led-sip-200w.jpg',
    'BM-21': 'bm-21.jpg',
    'BM-CPPR-20': 'co-ppr-1.png',
    'BM-CPPR-25': 'te-ppr.png',
    'BM-CPPR-32': 'noi-ppr.jpg',
    'BM-CRNPR-25': 'binh-minh-ppr-co-ren.png',
    'BM-NPR-32X25': 'bm-npr-32x25.jpg',
    'BM-CPVC-21': 'bm-cpvc-21.jpg',
    'BM-CPVC-27': 'bm-cpvc-27.jpg',
    'BM-CPVC-34': 'bm-cpvc-34.jpg',
    'BM-CPVC-42': 'bm-cpvc-42.jpg',
    'BM-PPR-20': 'binh-minh-ppr-20.png',
    'BM-PPR-25': 'binh-minh-ppr-25.png',
    'BM-PPR-32': 'binh-minh-ppr-32.png',
    'BM-PPR-40': 'binh-minh-ppr-40.png',
    'BM-PPR-50': 'binh-minh-ppr-50.png',
    'BM-U-PVC-042': 'bm-u-pvc-042.png',
    'BM-UPVC-21': 'bm-upvc-21.jpg',
    'BM-UPVC-34': 'bm-upvc-34.jpg',
    'BM-UPVC-42': 'bm-upvc-42.jpg',
    'BM-UPVC-49': 'bm-upvc-49.jpg',
    'BM-UPVC-60-18': 'bm-upvc-60-18.jpg',
    'BM-UPVC-60-25': 'bm-upvc-60-25.png',
    'BM-UPVC-90': 'bm-upvc-90.png'
}

ok = 0
for sku, f in mapping.items():
    try:
        url = 'https://tdtmaterial.id.vn/images/products/' + f
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5, context=ctx) as r:
            if r.status == 200:
                ok += 1
            else:
                print('FAIL status', sku, f, r.status)
    except Exception as e:
        print('FAIL err', sku, f, e)

print('FINAL VERIFICATION RESULT: ' + str(ok) + '/' + str(len(mapping)) + ' IMAGES SERVED WITH HTTP 200 OK!')
