const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const prisma = require('../prismaClient');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- LOGO UPLOAD CONFIGURATION ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Only allow JPG and PNG because jsPDF does not support WebP or SVG
    const allowedMimes = ['image/jpeg', 'image/png'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG and PNG image files are allowed for logos!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Middleware to check branding limits before upload
const checkBrandingLimit = async (req, res, next) => {
    // req.user is populated by auth middleware
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    if (req.user.plan && (req.user.plan.toUpperCase() === 'FREE' || req.user.plan.toUpperCase() === 'STARTER')) {
        return res.status(403).json({ 
            message: 'Custom branding (Logo) is only available on Pro Plan. Upgrade to upload your logo.' 
        });
    }
    next();
};

const docStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const docFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/csv',
        'text/x-csv',
        'text/plain'
    ];
    // Check mime type or extension as fallback
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel or CSV files are allowed!'), false);
    }
};

const uploadDoc = multer({ 
    storage: docStorage, 
    fileFilter: docFilter,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// --- SMART MAPPING LOGIC ---
const COLUMN_MAPPINGS = {
    companyName: [
        // English
        'company', 'company name', 'business', 'organization', 'entity', 'firm', 'client company',
        // Romanian
        'companie', 'nume companie', 'firma', 'nume firma', 'societate', 'denumire', 'entitate',
        // German
        'firma', 'unternehmen', 'gesellschaft', 'firmenname',
        // Dutch / Flemish
        'bedrijf', 'bedrijfsnaam', 'onderneming', 'maatschappij',
        // French
        'société', 'entreprise', 'raison sociale', 'nom de l\'entreprise',
        // Italian / Spanish
        'azienda', 'impresa', 'società', 'empresa', 'nombre de la empresa', 'razón social',
        // Nordic (SE, NO, DK)
        'företag', 'bolag', 'selskap', 'virksomhet', 'selskabsnavn'
    ],
    contactName: [
        // English
        'contact', 'contact person', 'contact name', 'person', 'representative',
        // Romanian
        'contact', 'persoana contact', 'persoana de contact', 'nume contact', 'delegat', 'reprezentant',
        // German
        'kontakt', 'ansprechpartner', 'kontaktperson',
        // Dutch
        'contact', 'contactpersoon',
        // French
        'contact', 'personne de contact',
        // Italian / Spanish
        'contatto', 'persona di contatto', 'contacto', 'persona de contacto',
        // Nordic
        'kontakt', 'kontaktperson'
    ],
    firstName: ['prenume', 'first name', 'first_name', 'given name', 'forename', 'vorname', 'voornaam', 'prénom', 'nombre', 'förnamn'],
    lastName: ['nume', 'nume familie', 'last name', 'last_name', 'surname', 'family name', 'nachname', 'achternaam', 'nom', 'apellido', 'efternamn'],
    clientName: ['name', 'full name', 'nume complet', 'client', 'nume prenume', 'nume', 'naam', 'nom', 'nombre', 'namn', 'navn'],
    email: ['email', 'e-mail', 'mail', 'adresa email', 'courriel', 'correo'],
    phone: ['phone', 'telefon', 'tel', 'mobile', 'mobil', 'celular', 'handy', 'telefoon', 'téléphone'],
    cui: ['cui', 'vat', 'vat number', 'cod fiscal', 'tax id', 'fiscal code', 'cf', 'ust-id', 'btw', 'tva', 'p.iva', 'nif', 'org nr', 'cvr'],
    regCom: ['reg com', 'j', 'nr reg', 'registration number', 'trade registry', 'nr. reg. com.', 'hrb', 'kvk', 'siret', 'org number'],
    address: ['address', 'adresa', 'street', 'strada', 'sediu', 'strasse', 'straat', 'rue', 'calle', 'gata', 'gate', 'vej'],
    city: ['city', 'oras', 'localitate', 'stadt', 'stad', 'ville', 'città', 'ciudad'],
    county: ['county', 'judet', 'district', 'state', 'province', 'bundesland', 'provincie', 'region', 'län', 'fylke'],
    country: ['country', 'tara', 'nation', 'land', 'pays', 'paese', 'pais'],
    zipCode: ['zip', 'cod postal', 'zip code', 'postal code', 'plz', 'postcode', 'code postal', 'cap']
};

// --- COMPANY DETECTION HEURISTICS ---
const COMPANY_INDICATORS = [
    // Legal Entities International
    'srl', 's.r.l', 'sa', 's.a', 'pfa', 'i.i', // RO
    'ltd', 'limited', 'inc', 'incorporated', 'corp', 'corporation', 'plc', 'llc', 'lp', // EN
    'gmbh', 'ag', 'kg', 'ug', 'ohg', 'e.v.', // DE/CH/AT
    'bv', 'b.v.', 'nv', 'n.v.', 'vof', 'cv', 'stichting', // NL/BE
    'ab', 'aktiebolag', 'oy', 'as', 'a/s', 'asa', 'ivs', 'aps', // Nordics
    'sarl', 'sas', 'sci', 'eurl', // FR
    'spa', 'sapa', 'snc', // IT
    'sl', 's.l.', 'slu', 'sa', // ES
    'z.o.o', 'sp.k', // PL
    'kft', 'rt', // HU
    'sro', 's.r.o', // CZ/SK
    'doo', 'd.o.o' // Balkan
];

const BUSINESS_KEYWORDS = [
    'group', 'grup', 'holding', 'holdings', 'invest', 'investment',
    'solutions', 'solutii', 'systems', 'sisteme',
    'services', 'servicii', 'consulting', 'consult', 'consultanta',
    'logistics', 'logistica', 'transport', 'trans',
    'construct', 'constructii', 'imobiliare', 'real estate',
    'trade', 'trading', 'comert', 'market', 'marketing',
    'shop', 'store', 'magazin',
    'tech', 'technology', 'tehnologie', 'soft', 'software', 'it',
    'media', 'studio', 'design', 'agency', 'agentie',
    'auto', 'motors', 'service',
    'farm', 'pharma', 'medical', 'clinic',
    'restaurant', 'cafe', 'hotel', 'resort',
    'global', 'international', 'euro', 'inter'
];

function calculateCompanyScore(value) {
    if (!value || typeof value !== 'string') return 0;
    const lowerVal = value.toLowerCase().trim();
    let score = 0;

    // 1. Legal Entity Check (High Weight)
    // Check if ends with or contains entity type
    for (const indicator of COMPANY_INDICATORS) {
        // Matches "Company SRL" or "Company Gmbh"
        if (lowerVal.includes(` ${indicator}`) || lowerVal.includes(`${indicator} `) || lowerVal === indicator) {
            score += 10;
            break; // Found one, that's enough
        }
    }

    // 2. Business Keyword Check (Medium Weight)
    for (const keyword of BUSINESS_KEYWORDS) {
        if (lowerVal.includes(keyword)) {
            score += 5;
        }
    }

    // 3. Structural Checks
    // Companies often have "&" or "+"
    if (lowerVal.includes('&') || lowerVal.includes('+')) score += 3;
    
    // Companies often have numbers (e.g. "24/7 Service", "Cloud 9")
    // but exclude simple numbers which might be phone numbers
    if (/\d/.test(lowerVal) && /[a-z]/i.test(lowerVal)) score += 1;

    // 4. Negative Check (Looks like a person)
    // Simple heuristic: Two words, capitalized, no weird symbols, common name patterns
    // This is hard to do universally, so we keep it light.
    // If it has NO company indicators and looks like "Name Surname", penalty?
    // Let's rely on positive scores for now.

    return score;
}

function normalizeHeader(header) {
    if (!header) return '';
    return header.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function findBestMatch(headers, targetField) {
    const possibleMatches = COLUMN_MAPPINGS[targetField] || [];
    
    // 1. Exact match (normalized)
    for (const header of headers) {
        const normalizedHeader = normalizeHeader(header);
        for (const match of possibleMatches) {
            if (normalizedHeader === normalizeHeader(match)) {
                return header;
            }
        }
    }
    
    // 2. Partial match (header contains keyword)
    for (const header of headers) {
        const normalizedHeader = normalizeHeader(header);
        for (const match of possibleMatches) {
            if (normalizedHeader.includes(normalizeHeader(match))) {
                return header;
            }
        }
    }
    
    return null;
}

function extractData(row, headerMap) {
    const data = {};
    for (const [field, header] of Object.entries(headerMap)) {
        if (header && row[header] !== undefined) {
            data[field] = row[header];
        }
    }
    return data;
}

// --- EXPORTS ---

exports.uploadLogo = [
    upload.single('logo'),
    (req, res) => {
        // Check Plan Restriction
        if (req.user && (req.user.plan === 'FREE' || req.user.plan === 'STARTER')) {
             if (req.file) {
                 try { fs.unlinkSync(path.join(uploadDir, req.file.filename)); } catch(e){}
             }
             return res.status(403).json({ message: 'Custom branding is only available on Pro Plan.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        // Validate file content based on type
        try {
            const filePath = path.join(uploadDir, req.file.filename);
            
            if (req.file.mimetype === 'image/svg+xml') {
                // SVG validation
                const svgContent = fs.readFileSync(filePath, 'utf8');
                
                // Basic SVG validation - check for XML declaration and SVG tag
                if (!svgContent.includes('<?xml') && !svgContent.includes('<svg')) {
                    fs.unlinkSync(filePath);
                    return res.status(400).json({ message: 'Invalid SVG file format - missing XML/SVG tags' });
                }
                
                // Check for potential XSS in SVG content
                if (svgContent.includes('<script') || svgContent.includes('javascript:')) {
                    fs.unlinkSync(filePath);
                    return res.status(400).json({ message: 'SVG file contains unsafe content' });
                }
            } else if (req.file.mimetype.startsWith('image/')) {
                // Basic validation for other image files - check if it's actually readable
                const imageBuffer = fs.readFileSync(filePath);
                
                // Check for common image file signatures (first few bytes)
                const header = imageBuffer.slice(0, 4).toString('hex');
                
                // JPEG: FFD8FF
                // PNG: 89504E47
                // WEBP: 52494646
                const validHeaders = {
                    'jpeg': ['ffd8ff'],
                    'png': ['89504e47'],
                    'webp': ['52494646']
                };
                
                const fileType = req.file.mimetype.split('/')[1];
                const expectedHeaders = validHeaders[fileType];
                
                if (expectedHeaders && !expectedHeaders.some(h => header.startsWith(h))) {
                    fs.unlinkSync(filePath);
                    return res.status(400).json({ message: `Invalid ${fileType.toUpperCase()} file format` });
                }
            }
        } catch (error) {
            // If we can't read the file, it's likely corrupted
            try {
                fs.unlinkSync(path.join(uploadDir, req.file.filename));
            } catch (e) {}
            return res.status(400).json({ message: 'File is corrupted or unreadable' });
        }
        
        // Construct URL
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Normalize path separators for URL
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
        
        res.json({ url: fileUrl });
    }
];

exports.uploadClients = [
    uploadDoc.single('file'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = path.join(uploadDir, req.file.filename);
        const debugPath = path.join(uploadDir, 'last_import_debug.txt');

        try {
            // 1. Read Excel File
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // A. PRE-SCAN for Header Row
            // Read first 20 rows as array of arrays
            const range = xlsx.utils.decode_range(sheet['!ref']);
            const preScanOpts = { header: 1, range: 0, defval: "" }; // Start from row 0
            let allRows = xlsx.utils.sheet_to_json(sheet, preScanOpts);
            
            // Limit to first 20 rows for header detection
            const searchLimit = Math.min(allRows.length, 20);
            
            let bestHeaderRowIndex = 0;
            let maxMatches = 0;
            
            // Keywords to identify header row
            const KNOWN_HEADERS = [
                'name', 'nume', 'company', 'companie', 'firma', 'email', 'phone', 'telefon', 
                'address', 'adresa', 'cui', 'vat', 'contact', 'city', 'oras'
            ];

            for (let i = 0; i < searchLimit; i++) {
                const row = allRows[i];
                let matches = 0;
                if (Array.isArray(row)) {
                    row.forEach(cell => {
                        if (cell && typeof cell === 'string') {
                            const val = cell.toLowerCase().trim();
                            if (KNOWN_HEADERS.some(h => val.includes(h))) {
                                matches++;
                            }
                        }
                    });
                }
                if (matches > maxMatches) {
                    maxMatches = matches;
                    bestHeaderRowIndex = i;
                }
            }

            // If we found a better row (matches >= 2), use it. Otherwise default to 0.
            const headerRowIndex = maxMatches >= 2 ? bestHeaderRowIndex : 0;

            // B. Parse Data with detected header
            // Use range option to skip rows before header
            const rawData = xlsx.utils.sheet_to_json(sheet, { 
                defval: "",
                range: headerRowIndex 
            });

            if (rawData.length === 0) {
                fs.unlinkSync(filePath);
                return res.status(400).json({ message: 'File is empty' });
            }

            // 2. Identify Headers
            // Get headers from the first row keys (safe because defval ensures keys exist)
            let headers = Object.keys(rawData[0]);
            
            // Debug: Write headers to a file in uploads
            try {
                fs.writeFileSync(debugPath, `Detected Header Row Index: ${headerRowIndex} (Matches: ${maxMatches})\nHeaders: ${JSON.stringify(headers)}\n`);
            } catch (err) {
                console.error("Failed to write debug file:", err);
            }

            const headerMap = {};
            
            // --- SMART COLUMN DETECTION ---
            
            // 1. Header-based detection (Primary)
            for (const field of Object.keys(COLUMN_MAPPINGS)) {
                const match = findBestMatch(headers, field);
                if (match) {
                    headerMap[field] = match;
                    fs.appendFileSync(debugPath, `Mapped '${field}' to column '${match}'\n`);
                }
            }
            
            // 2. Content-based detection (Fallback/Verification)
            // If Company Name is missing or ambiguous, scan content to find the best column
            if (!headerMap.companyName) {
                const companyScores = {};
                
                // Initialize scores
                headers.forEach(h => companyScores[h] = 0);
                
                // Scan first 20 rows
                const sampleRows = rawData.slice(0, 20);
                for (const row of sampleRows) {
                    for (const header of headers) {
                        const val = String(row[header] || '');
                        companyScores[header] += calculateCompanyScore(val);
                    }
                }
                
                // Find column with highest score > 0
                let bestHeader = null;
                let maxScore = 0;
                for (const [header, score] of Object.entries(companyScores)) {
                    if (score > maxScore) {
                        maxScore = score;
                        bestHeader = header;
                    }
                }
                
                if (bestHeader && maxScore > 10) { // Threshold > 10 to be sure
                    headerMap.companyName = bestHeader;
                    fs.appendFileSync(debugPath, `Smart Detected Company Column: ${bestHeader} (Score: ${maxScore})\n`);
                }
            }
            
            // 3. Last Resort: Look for "Company" keyword specifically if still missing
            if (!headerMap.companyName) {
                 // Try exact matches first
                 let companyHeader = headers.find(h => {
                     const lower = h.toString().toLowerCase().trim();
                     return lower === 'company' || lower === 'firma' || lower === 'business';
                 });
                 
                 // If not found, try partial matches
                 if (!companyHeader) {
                     companyHeader = headers.find(h => {
                         const lower = h.toString().toLowerCase().trim();
                         return (lower.includes('company') || lower.includes('firma') || lower.includes('business')) && !lower.includes('phone') && !lower.includes('email') && !lower.includes('address');
                          // Exclude "Company Phone", etc. But allow "Company Name".
                     });
                 }
                 
                 if (companyHeader) headerMap.companyName = companyHeader;
            }

            fs.appendFileSync(debugPath, `Final Mapping: ${JSON.stringify(headerMap)}\n`);
            
            const clientsToInsert = [];
            const userId = req.user.id; // Assuming auth middleware adds user to req

            // 3. Process Rows
            const debugLogPath = path.join(__dirname, '../import_debug.log');
            fs.writeFileSync(debugLogPath, `Import started at ${new Date().toISOString()}\nHeaders detected: ${JSON.stringify(headers)}\nMapping: ${JSON.stringify(headerMap)}\n\n`);

            for (const row of rawData) {
                const extracted = extractData(row, headerMap);
                
                // Debug log for first few rows
                if (clientsToInsert.length < 5) {
                    fs.appendFileSync(debugLogPath, `Row: ${JSON.stringify(row)}\nExtracted: ${JSON.stringify(extracted)}\n`);
                }

                // LOGIC: Determine Entity Name vs Contact Person
                let finalName = '';
                let finalContactPerson = null;

                // ADJUSTMENT: If we have 'clientName' (generic Name) and 'lastName' (Surname) but no 'firstName',
                // assume 'clientName' is the First Name.
                // BUT only if clientName is different from lastName (avoid duplication if "Name" maps to both)
                if (!extracted.firstName && extracted.clientName && extracted.lastName && extracted.clientName !== extracted.lastName) {
                    extracted.firstName = extracted.clientName;
                }

                // Helper to combine names
                const buildFullName = (first, last) => {
                    if (first && last) {
                        if (String(first).trim() === String(last).trim()) return first;
                        return `${first} ${last}`;
                    }
                    return first || last || null;
                };

                const personNameFromSplit = buildFullName(extracted.firstName, extracted.lastName);

                // Strategy:
                // 1. "Company" column is King for client.name.
                // 2. "Contact" column is King for client.contactPerson.
                // 3. "Name" (clientName) is ambiguous.
                //    - If Company exists, "Name" -> Contact Person.
                //    - If Company missing, "Name" -> Company Name (Entity Name).

                const hasCompany = extracted.companyName && extracted.companyName.toString().trim().length > 0;
                const hasContact = extracted.contactName && extracted.contactName.toString().trim().length > 0;
                const hasGenericName = extracted.clientName && extracted.clientName.toString().trim().length > 0;
                const hasSplitName = !!personNameFromSplit;
                
                // Content-based check for "Company" in Name column if Company column is missing
                // This handles cases where user has "Name" column but it contains company names (SRL, etc)
                // AND we haven't found a better company column.
                let nameLooksLikeCompany = false;
                if (hasGenericName && !hasCompany) {
                    const val = extracted.clientName.toString();
                    if (calculateCompanyScore(val) > 0) {
                         nameLooksLikeCompany = true;
                    }
                }

                if (hasCompany) {
                    // Scenario A: We have a company name.
                    finalName = extracted.companyName;

                    // Find the best contact person
                    if (hasContact) {
                        finalContactPerson = extracted.contactName;
                    } else if (hasSplitName) {
                        finalContactPerson = personNameFromSplit;
                    } else if (hasGenericName) {
                        // Fallback: Use the "Name" column as contact person
                        finalContactPerson = extracted.clientName;
                    }
                } else {
                    // Scenario B: No explicit company name found via mapping.
                    
                    // FALLBACK: Direct Row Scan
                    // Sometimes mapping fails (empty header in first row, etc). 
                    // Let's check the raw row for obvious company columns.
                    let foundCompanyInRow = false;
                    const rawKeys = Object.keys(row);
                    const companyKey = rawKeys.find(k => {
                        const kl = k.toLowerCase().trim();
                        return kl === 'company' || kl === 'firma' || kl === 'company name' || kl === 'business';
                    });

                    if (companyKey && row[companyKey]) {
                        const val = row[companyKey].toString().trim();
                        if (val.length > 0) {
                            finalName = val;
                            foundCompanyInRow = true;
                            // If we found company here, "Name" column likely is Contact
                            if (hasGenericName) {
                                finalContactPerson = extracted.clientName;
                            } else if (hasSplitName) {
                                finalContactPerson = personNameFromSplit;
                            }
                        }
                    }

                    if (!foundCompanyInRow) {
                        if (nameLooksLikeCompany) {
                            // "Name" column is actually the Company Name
                            finalName = extracted.clientName;
                            if (hasContact) {
                                finalContactPerson = extracted.contactName;
                            } else if (hasSplitName) {
                                 finalContactPerson = personNameFromSplit;
                            }
                        } else if (hasGenericName) {
                            // !!! IMPORTANT CHANGE !!!
                            // If we only have "Name" and NO "Company" detected, 
                            // BUT we are importing, we default to using "Name" as the main identifier (Company Field in DB).
                            // HOWEVER, if the user explicitly has a "Company" column in their Excel (which failed detection),
                            // this logic will populate "Name" (John Doe) into Company field.
                            // 
                            // We can't know for sure if detection failed or if column is missing.
                            // But we can check if "Name" looks like a person.
                            // If it looks like a person, and we have NO company, 
                            // maybe we should put it in contactPerson? 
                            // But Prisma needs 'name'.
                            
                            finalName = extracted.clientName;
                            
                            // If we also have a split name or contact name, use that as contact
                             if (hasContact) {
                                finalContactPerson = extracted.contactName;
                            } else if (hasSplitName) {
                                 // If "Name" is "Company X" and we have "John Doe" in split columns
                                 finalContactPerson = personNameFromSplit;
                            }
                        } else if (hasSplitName) {
                            finalName = personNameFromSplit;
                            finalContactPerson = personNameFromSplit;
                        } else if (hasContact) {
                            finalName = extracted.contactName;
                            finalContactPerson = extracted.contactName;
                        }
                    }
                }
                
                if (!finalName || finalName.trim() === '') {
                    continue;
                }

                // Prepare object for Prisma
                clientsToInsert.push({
                    userId: userId,
                    name: finalName,
                    contactPerson: finalContactPerson,
                    email: extracted.email || null,
                    phone: extracted.phone ? extracted.phone.toString() : null,
                    cui: extracted.cui ? extracted.cui.toString() : null,
                    regCom: extracted.regCom ? extracted.regCom.toString() : null,
                    address: extracted.address || null,
                    city: extracted.city || null,
                    county: extracted.county || null,
                    country: extracted.country || null,
                    zipCode: extracted.zipCode ? extracted.zipCode.toString() : null
                });
            }

            // 4. Batch Insert
            if (clientsToInsert.length > 0) {
                // Check Plan Limits
                const currentCount = await prisma.client.count({ where: { userId: userId } });
                const newTotal = currentCount + clientsToInsert.length;

                const userPlan = req.user.plan ? req.user.plan.toUpperCase() : 'FREE';

                if (userPlan === 'FREE' && newTotal > 3) {
                     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                     return res.status(403).json({ message: `Import exceeds Free Plan limit (Max 3 clients). You have ${currentCount} and are trying to add ${clientsToInsert.length}.` });
                }
                if (userPlan === 'STARTER' && newTotal > 50) {
                     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                     return res.status(403).json({ message: `Import exceeds Starter Plan limit (Max 50 clients). You have ${currentCount} and are trying to add ${clientsToInsert.length}.` });
                }

                await prisma.client.createMany({
                    data: clientsToInsert
                });
            }

            // Cleanup
            fs.unlinkSync(filePath);

            const debugInfo = {
                headers: headers,
                map: headerMap,
                sampleRow: rawData[0] ? rawData[0] : null
            };

            res.json({ 
                message: `Successfully imported ${clientsToInsert.length} clients`,
                details: {
                    mappedFields: Object.keys(headerMap),
                    totalRows: rawData.length,
                    imported: clientsToInsert.length,
                    debug: debugInfo
                }
            });

        } catch (error) {
            console.error('Import Error:', error);
            try {
                fs.appendFileSync(debugPath, `\nFATAL ERROR: ${error.message}\n${error.stack}\n`);
            } catch (e) {}
            // Try to cleanup
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            res.status(500).json({ message: 'Error processing import file', error: error.message });
        }
    }
];
