package com.esotericsoftware.spine.formatter;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import javax.xml.parsers.*;
import org.w3c.dom.*;
import org.eclipse.jdt.core.formatter.CodeFormatter;
import org.eclipse.jdt.internal.formatter.DefaultCodeFormatter;
import org.eclipse.jface.text.Document;
import org.eclipse.jface.text.IDocument;
import org.eclipse.text.edits.TextEdit;

public class EclipseFormatter {
    private static final String LINE_DELIMITER = "\n";
    
    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("Usage: java -jar eclipse-formatter.jar <eclipse-formatter.xml> <file1.java> [file2.java ...]");
            System.exit(1);
        }
        
        // Load formatter settings from XML
        Map<String, String> options = loadFormatterSettings(args[0]);
        
        // Create formatter
        CodeFormatter formatter = new DefaultCodeFormatter(options);
        
        // Format each file
        int changedCount = 0;
        int errorCount = 0;
        
        for (int i = 1; i < args.length; i++) {
            try {
                if (formatFile(formatter, args[i])) {
                    changedCount++;
                }
            } catch (Exception e) {
                System.err.println("Error formatting " + args[i] + ": " + e.getMessage());
                errorCount++;
            }
        }
        
        System.out.println("Formatting complete: " + changedCount + " files changed, " + errorCount + " errors");
        
        if (errorCount > 0) {
            System.exit(1);
        }
    }
    
    private static Map<String, String> loadFormatterSettings(String xmlPath) throws Exception {
        Map<String, String> settings = new HashMap<>();
        
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        org.w3c.dom.Document doc = builder.parse(new File(xmlPath));
        
        // Handle both direct settings and profile-based settings
        NodeList profiles = doc.getElementsByTagName("profile");
        if (profiles.getLength() > 0) {
            // Profile-based format (Eclipse export)
            Element profile = (Element) profiles.item(0);
            NodeList settingNodes = profile.getElementsByTagName("setting");
            
            for (int i = 0; i < settingNodes.getLength(); i++) {
                Element setting = (Element) settingNodes.item(i);
                String id = setting.getAttribute("id");
                String value = setting.getAttribute("value");
                if (id != null && !id.isEmpty() && value != null) {
                    settings.put(id, value);
                }
            }
        } else {
            // Direct settings format
            NodeList settingNodes = doc.getElementsByTagName("setting");
            
            for (int i = 0; i < settingNodes.getLength(); i++) {
                Element setting = (Element) settingNodes.item(i);
                String id = setting.getAttribute("id");
                String value = setting.getAttribute("value");
                if (id != null && !id.isEmpty() && value != null) {
                    settings.put(id, value);
                }
            }
        }
        
        // Removed verbose output
        
        return settings;
    }
    
    private static boolean formatFile(CodeFormatter formatter, String filePath) throws Exception {
        Path path = Paths.get(filePath);
        
        if (!Files.exists(path)) {
            throw new FileNotFoundException("File not found: " + filePath);
        }
        
        String content = Files.readString(path);
        
        // Determine if it's a module-info.java file
        int kind = path.getFileName().toString().equals("module-info.java") 
            ? CodeFormatter.K_MODULE_INFO 
            : CodeFormatter.K_COMPILATION_UNIT;
        kind |= CodeFormatter.F_INCLUDE_COMMENTS;
        
        // Format the code
        TextEdit edit = formatter.format(kind, content, 0, content.length(), 0, LINE_DELIMITER);
        
        if (edit == null) {
            throw new IllegalArgumentException("Cannot format file - invalid Java syntax or formatter configuration issue");
        }
        
        // Apply the edit
        IDocument document = new Document(content);
        edit.apply(document);
        String formatted = document.get();
        
        // Only write if content changed
        if (!content.equals(formatted)) {
            Files.writeString(path, formatted);
            System.out.println("Formatted: " + filePath);
            return true;
        } else {
            // Silent when no changes
            return false;
        }
    }
}