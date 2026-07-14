import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toSnakeCase } from '../../../spine-c/codegen/src/types.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Get license header from spine-cpp source
const LICENSE_HEADER = fs.readFileSync(path.join(__dirname, '../../../spine-cpp/src/spine/Skeleton.cpp'), 'utf8')
    .split('\n')
    .slice(0, 28)
    .map((line, index, array) => {
    // Convert C++ block comment format to Swift line comment format
    if (index === 0 && line.startsWith('/****')) {
        return `//${line.substring(4).replace(/\*+/g, '')}`;
    }
    else if (index === array.length - 1 && (line.startsWith(' ****') || line.trim() === '*/')) {
        return `//${line.substring(line.indexOf('*') + 1).replace(/\*+/g, '').replace(/\//g, '')}`;
    }
    else if (line.startsWith(' ****') || line.trim() === '*/') {
        return `// ${line.substring(4)}`;
    }
    else if (line.startsWith(' * ')) {
        return `// ${line.substring(3)}`;
    }
    else if (line.startsWith(' *')) {
        return `//${line.substring(2)}`;
    }
    else {
        return line;
    }
})
    .join('\n');
export class SwiftWriter {
    outputDir;
    enumNames = new Set();
    classMap = new Map(); // name -> class
    inheritance = {};
    isInterface = {};
    supertypes = {}; // for RTTI switching
    subtypes = {};
    constructor(outputDir) {
        this.outputDir = outputDir;
        this.cleanOutputDirectory();
    }
    cleanOutputDirectory() {
        if (fs.existsSync(this.outputDir)) {
            fs.rmSync(this.outputDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.outputDir, { recursive: true });
    }
    // Step 1: Transform C types to clean Swift model
    transformToSwiftModel(cTypes, cEnums, inheritance, isInterface, supertypes) {
        // Store data for reference
        this.inheritance = inheritance;
        this.isInterface = isInterface;
        this.supertypes = supertypes;
        for (const cType of cTypes) {
            this.classMap.set(cType.name, cType);
        }
        for (const cEnum of cEnums) {
            this.enumNames.add(cEnum.name);
        }
        const swiftClasses = [];
        const swiftEnums = [];
        // Transform enums
        for (const cEnum of cEnums) {
            swiftEnums.push(this.transformEnum(cEnum));
        }
        // Transform classes in dependency order
        const sortedTypes = this.sortByInheritance(cTypes);
        for (const cType of sortedTypes) {
            swiftClasses.push(this.transformClass(cType));
        }
        return { classes: swiftClasses, enums: swiftEnums };
    }
    // Step 2: Generate Swift code from clean model
    generateSwiftCode(swiftClass) {
        const lines = [];
        // Header
        lines.push(this.generateHeader());
        // Imports
        lines.push(...this.generateImports(swiftClass.imports, swiftClass.hasRtti));
        // Class/Protocol declaration
        lines.push(this.generateClassDeclaration(swiftClass));
        // Class body
        if (swiftClass.type === 'protocol') {
            lines.push(...this.generateProtocolBody(swiftClass));
        }
        else {
            lines.push(...this.generateClassBody(swiftClass));
        }
        lines.push('}');
        return lines.join('\n');
    }
    // Step 3: Write files
    async writeAll(cTypes, cEnums, cArrayTypes, inheritance = {}, isInterface = {}, supertypes = {}, subtypes = {}) {
        this.subtypes = subtypes;
        // Step 1: Transform to clean model
        const { classes, enums } = this.transformToSwiftModel(cTypes, cEnums, inheritance, isInterface, supertypes);
        // Step 2 & 3: Generate and write files
        for (const swiftEnum of enums) {
            const content = this.generateEnumCode(swiftEnum);
            const fileName = `${toSnakeCase(swiftEnum.name)}.swift`;
            const filePath = path.join(this.outputDir, fileName);
            fs.writeFileSync(filePath, content);
        }
        for (const swiftClass of classes) {
            const content = this.generateSwiftCode(swiftClass);
            const fileName = `${toSnakeCase(swiftClass.name)}.swift`;
            const filePath = path.join(this.outputDir, fileName);
            fs.writeFileSync(filePath, content);
        }
        // Generate arrays.swift
        await this.writeArraysFile(cArrayTypes);
        // Write main export file
        await this.writeExportFile(classes, enums);
    }
    // Class type resolution
    determineClassType(cType) {
        if (this.isInterface[cType.name])
            return 'protocol';
        if (cType.cppType.isAbstract)
            return 'abstract';
        return 'concrete';
    }
    // Inheritance resolution
    resolveInheritance(cType) {
        const inheritanceInfo = this.inheritance[cType.name];
        return {
            extends: inheritanceInfo?.extends ? this.toSwiftTypeName(inheritanceInfo.extends) : undefined,
            implements: (inheritanceInfo?.mixins || []).map(mixin => this.toSwiftTypeName(mixin))
        };
    }
    transformEnum(cEnum) {
        const swiftEnum = {
            name: this.toSwiftTypeName(cEnum.name),
            values: cEnum.values.map((value, index) => {
                let parsedValue;
                if (value.value !== undefined) {
                    // Handle bit shift expressions like "1 << 0"
                    const bitShiftMatch = value.value.match(/^(\d+)\s*<<\s*(\d+)$/);
                    if (bitShiftMatch) {
                        const base = parseInt(bitShiftMatch[1]);
                        const shift = parseInt(bitShiftMatch[2]);
                        parsedValue = base << shift;
                    }
                    else {
                        // Try to parse as regular number
                        parsedValue = Number.parseInt(value.value);
                        if (isNaN(parsedValue)) {
                            console.warn(`Warning: Could not parse enum value ${value.name} = ${value.value}, using index ${index}`);
                            parsedValue = index;
                        }
                    }
                }
                else {
                    parsedValue = index;
                }
                return {
                    name: this.toSwiftEnumValueName(value.name, cEnum.name),
                    value: parsedValue
                };
            })
        };
        return swiftEnum;
    }
    transformClass(cType) {
        const swiftName = this.toSwiftTypeName(cType.name);
        const classType = this.determineClassType(cType);
        const inheritance = this.resolveInheritance(cType);
        return {
            name: swiftName,
            type: classType,
            inheritance,
            imports: this.collectImports(cType),
            members: this.processMembers(cType, classType),
            hasRtti: this.hasRttiMethod(cType),
        };
    }
    // Unified Method Processing
    processMembers(cType, classType) {
        const members = [];
        // Add constructors for concrete classes only
        if (classType === 'concrete') {
            for (const constr of cType.constructors) {
                members.push(this.createConstructor(constr, cType));
            }
        }
        // Add destructor as deinit for concrete classes
        if (classType === 'concrete' && cType.destructor) {
            members.push(this.createDisposeMethod(cType.destructor, cType));
        }
        // Process methods with unified logic
        const validMethods = cType.methods.filter(method => {
            if (this.hasRawPointerParameters(method)) {
                return false;
            }
            if (this.isMethodInherited(method, cType)) {
                return false;
            }
            return true;
        });
        const renumberedMethods = this.renumberMethods(validMethods, cType.name);
        // Group getter/setter pairs to avoid duplicate property declarations
        const propertyMap = new Map();
        const regularMethods = [];
        const overloadedSetters = this.findOverloadedSetters(renumberedMethods);
        for (const methodInfo of renumberedMethods) {
            const { method, renamedMethod } = methodInfo;
            if (this.isGetter(method)) {
                const propName = renamedMethod || this.extractPropertyName(method.name, cType.name);
                const prop = propertyMap.get(propName) || {};
                prop.getter = { method, renamedMethod };
                propertyMap.set(propName, prop);
            }
            else if (this.isSetter(method, overloadedSetters)) {
                const propName = renamedMethod || this.extractPropertyName(method.name, cType.name);
                const prop = propertyMap.get(propName) || {};
                prop.setter = { method, renamedMethod };
                propertyMap.set(propName, prop);
            }
            else {
                regularMethods.push({ method, renamedMethod });
            }
        }
        // Create combined property members
        for (const [propName, { getter, setter }] of propertyMap) {
            if (getter && setter) {
                // Combined getter/setter property
                members.push(this.createCombinedProperty(getter.method, setter.method, cType, classType, propName));
            }
            else if (getter) {
                // Read-only property
                members.push(this.createGetter(getter.method, cType, classType, getter.renamedMethod));
            }
            else if (setter) {
                // Write-only property (rare)
                members.push(this.createSetter(setter.method, cType, classType, setter.renamedMethod));
            }
        }
        // Add regular methods
        for (const { method, renamedMethod } of regularMethods) {
            members.push(this.createMethod(method, cType, classType, renamedMethod));
        }
        return members;
    }
    createCombinedProperty(getter, setter, cType, classType, propName) {
        const swiftReturnType = this.toSwiftReturnType(getter.returnType, getter.returnTypeNullable);
        // For protocols, we just need the declaration
        if (classType === 'protocol') {
            return {
                type: 'getter', // Will be rendered as a property with get/set
                name: propName,
                swiftReturnType,
                parameters: [],
                isOverride: false,
                implementation: '', // No implementation for protocols
                cMethodName: getter.name,
                hasSetter: true, // Mark that this property has a setter
                documentation: getter.documentation || setter.documentation // Use getter's doc if available, otherwise setter's
            };
        }
        // For concrete/abstract classes, create implementation
        const cTypeName = this.toCTypeName(this.toSwiftTypeName(cType.name));
        const getterImpl = `let result = ${getter.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self))
        ${this.generateReturnConversion(getter.returnType, 'result', getter.returnTypeNullable)}`;
        const setterParam = setter.parameters[1]; // First param is self
        const setterImpl = `${setter.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self), ${this.convertSwiftToC('newValue', setterParam)})`;
        const isOverride = this.isMethodOverride(getter, cType) || this.isMethodOverride(setter, cType);
        return {
            type: 'getter', // Combined property
            name: propName,
            swiftReturnType,
            parameters: [],
            isOverride,
            implementation: getterImpl,
            setterImplementation: setterImpl,
            cMethodName: getter.name,
            hasSetter: true,
            documentation: getter.documentation || setter.documentation // Use getter's doc if available, otherwise setter's
        };
    }
    processMethod(method, cType, classType, renamedMethod, overloadedSetters) {
        if (this.isGetter(method)) {
            return this.createGetter(method, cType, classType, renamedMethod);
        }
        else if (this.isSetter(method, overloadedSetters)) {
            return this.createSetter(method, cType, classType, renamedMethod);
        }
        else {
            return this.createMethod(method, cType, classType, renamedMethod);
        }
    }
    // Unified getter detection for ALL classes
    isGetter(method) {
        return (method.name.includes('_get_') && method.parameters.length === 1) ||
            (method.returnType === 'bool' && method.parameters.length === 1 &&
                (method.name.includes('_has_') || method.name.includes('_is_') || method.name.includes('_was_')));
    }
    isSetter(method, overloadedSetters) {
        const isBasicSetter = method.returnType === 'void' &&
            method.parameters.length === 2 &&
            method.name.includes('_set_');
        if (!isBasicSetter)
            return false;
        // If this setter has overloads, don't generate it as a setter
        if (overloadedSetters?.has(method.name)) {
            return false;
        }
        return true;
    }
    findOverloadedSetters(renumberedMethods) {
        const setterBasenames = new Map();
        // Group setter methods by their base name
        for (const methodInfo of renumberedMethods) {
            const method = methodInfo.method;
            if (method.returnType === 'void' &&
                method.parameters.length === 2 &&
                method.name.includes('_set_')) {
                // Extract base name by removing numbered suffix
                const match = method.name.match(/^(.+?)_(\d+)$/);
                const baseName = match ? match[1] : method.name;
                if (!setterBasenames.has(baseName)) {
                    setterBasenames.set(baseName, []);
                }
                setterBasenames.get(baseName)?.push(method.name);
            }
        }
        // Find setters that have multiple methods with the same base name
        const overloadedSetters = new Set();
        for (const [_baseName, methodNames] of setterBasenames) {
            if (methodNames.length > 1) {
                // Multiple setters with same base name - mark all as overloaded
                for (const methodName of methodNames) {
                    overloadedSetters.add(methodName);
                }
            }
        }
        return overloadedSetters;
    }
    createDisposeMethod(destructor, cType) {
        // In Swift, we don't expose dispose() method, it's handled in deinit
        // This is just a marker for the code generator
        const cTypeName = this.toCTypeName(this.toSwiftTypeName(cType.name));
        return {
            type: 'method',
            name: '__dispose__', // Special marker
            swiftReturnType: 'Void',
            parameters: [],
            isOverride: false,
            implementation: `${destructor.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self))`,
            cMethodName: destructor.name,
            documentation: destructor.documentation
        };
    }
    createConstructor(constr, cType) {
        const swiftClassName = this.toSwiftTypeName(cType.name);
        const params = constr.parameters.map(p => ({
            name: p.name,
            swiftType: this.toSwiftParameterType(p),
            cType: p.cType
        }));
        const args = constr.parameters.map(p => this.convertSwiftToC(p.name, p)).join(', ');
        const implementation = `let ptr = ${constr.name}(${args})
        return ${swiftClassName}(fromPointer: ptr!)`;
        return {
            type: 'constructor',
            name: this.getConstructorName(constr, cType),
            swiftReturnType: swiftClassName,
            parameters: params,
            isOverride: false,
            implementation,
            cMethodName: constr.name,
            documentation: constr.documentation
        };
    }
    createGetter(method, cType, classType, renamedMethod) {
        const propertyName = renamedMethod || this.extractPropertyName(method.name, cType.name);
        let swiftReturnType = this.toSwiftReturnType(method.returnType, method.returnTypeNullable);
        // Special handling for protocol conformance with covariant return types
        // If this is a concrete class implementing a protocol, and the property is 'data',
        // we need to return the protocol type instead of the concrete type
        if (classType !== 'protocol' && propertyName === 'data' &&
            this.inheritance[cType.name]?.mixins?.includes('spine_constraint')) {
            // Check if the return type is any kind of constraint data
            // (could be spine_ik_constraint_data, spine_slider_data, etc.)
            const returnClass = this.classMap.get(method.returnType);
            if (returnClass && this.inheritance[method.returnType]?.mixins?.includes('spine_constraint_data')) {
                // Return the protocol type for proper conformance
                swiftReturnType = swiftReturnType.endsWith('?') ? 'ConstraintData?' : 'ConstraintData';
            }
        }
        // Protocol methods have no implementation
        let implementation = '';
        if (classType !== 'protocol') {
            const cTypeName = this.toCTypeName(this.toSwiftTypeName(cType.name));
            implementation = `let result = ${method.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self))
        ${this.generateReturnConversion(method.returnType, 'result', method.returnTypeNullable)}`;
        }
        // Check if this is an override
        const isOverride = this.isMethodOverride(method, cType);
        return {
            type: 'getter',
            name: propertyName,
            swiftReturnType,
            parameters: [],
            isOverride,
            implementation,
            cMethodName: method.name,
            documentation: method.documentation
        };
    }
    createSetter(method, cType, classType, renamedMethod) {
        let propertyName = renamedMethod || this.extractPropertyName(method.name, cType.name);
        const param = method.parameters[1]; // First param is self
        const swiftParam = {
            name: 'value',
            swiftType: this.toSwiftParameterType(param),
            cType: param.cType
        };
        // Handle numeric suffixes in setter names
        if (!renamedMethod) {
            const match = propertyName.match(/^(\w+)_(\d+)$/);
            if (match) {
                propertyName = `${match[1]}${match[2]}`;
            }
            else if (/^\d+$/.test(propertyName)) {
                propertyName = `set${propertyName}`;
            }
        }
        // Protocol methods have no implementation
        let implementation = '';
        if (classType !== 'protocol') {
            const cTypeName = this.toCTypeName(this.toSwiftTypeName(cType.name));
            implementation = `${method.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self), ${this.convertSwiftToC('newValue', param)})`;
        }
        const isOverride = this.isMethodOverride(method, cType);
        return {
            type: 'setter',
            name: propertyName,
            swiftReturnType: 'Void',
            parameters: [swiftParam],
            isOverride,
            implementation,
            cMethodName: method.name,
            documentation: method.documentation
        };
    }
    createMethod(method, cType, classType, renamedMethod) {
        let methodName = renamedMethod || this.toSwiftMethodName(method.name, cType.name);
        const swiftReturnType = this.toSwiftReturnType(method.returnType, method.returnTypeNullable);
        // Check if this is a static method
        const isStatic = method.parameters.length === 0 ||
            (method.parameters[0].name !== 'self' &&
                !method.parameters[0].cType.startsWith(cType.name));
        // Rename static rtti method to avoid conflict with getter
        if (isStatic && methodName === 'rtti') {
            methodName = 'rttiStatic';
        }
        // Handle Objective-C conflicts - rename problematic methods
        if (methodName === 'copy') {
            methodName = 'copyAttachment'; // Or another appropriate name based on context
        }
        // Parameters (skip 'self' parameter for instance methods)
        const paramStartIndex = isStatic ? 0 : 1;
        const params = method.parameters.slice(paramStartIndex).map(p => ({
            name: p.name,
            swiftType: this.toSwiftParameterType(p),
            cType: p.cType
        }));
        // Protocol methods have no implementation (except rttiStatic)
        let implementation = '';
        if (classType !== 'protocol' || methodName === 'rttiStatic') {
            const cTypeName = this.toCTypeName(this.toSwiftTypeName(cType.name));
            const args = method.parameters.map((p, i) => {
                if (!isStatic && i === 0)
                    return `_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self)`; // self parameter
                return this.convertSwiftToC(p.name, p);
            }).join(', ');
            if (method.returnType === 'void') {
                implementation = `${method.name}(${args})`;
            }
            else {
                implementation = `let result = ${method.name}(${args})
        ${this.generateReturnConversion(method.returnType, 'result', method.returnTypeNullable)}`;
            }
        }
        const isOverride = this.isMethodOverride(method, cType);
        return {
            type: isStatic ? 'static_method' : 'method',
            name: methodName,
            swiftReturnType,
            parameters: params,
            isOverride,
            implementation,
            cMethodName: method.name,
            documentation: method.documentation
        };
    }
    // Code generation methods
    generateHeader() {
        return `${LICENSE_HEADER}

// AUTO GENERATED FILE, DO NOT EDIT.`;
    }
    generateImports(imports, hasRtti) {
        const lines = [];
        lines.push('');
        lines.push('import Foundation');
        lines.push('import SpineC');
        // In Swift, all types are in the same module, no need for individual imports
        // RTTI is a type, not a module
        return lines;
    }
    // Class declaration generation
    generateClassDeclaration(swiftClass) {
        let declaration = '';
        if (swiftClass.type === 'protocol') {
            declaration = `public protocol ${swiftClass.name}`;
        }
        else {
            // Add @objc annotations for Objective-C compatibility
            const objcAnnotations = `@objc(Spine${swiftClass.name})\n@objcMembers\n`;
            if (swiftClass.type === 'abstract') {
                declaration = `${objcAnnotations}open class ${swiftClass.name}`;
            }
            else {
                // Check if any abstract class extends from this class
                // If so, this class needs to be open as well
                let needsOpen = false;
                // Find the C type name for this Swift class
                const cTypeName = this.fromSwiftTypeName(swiftClass.name);
                for (const [childName, inheritanceInfo] of Object.entries(this.inheritance)) {
                    if (inheritanceInfo.extends === cTypeName) {
                        const childClass = this.classMap.get(childName);
                        if (childClass && this.isAbstract(childClass)) {
                            needsOpen = true;
                            break;
                        }
                    }
                }
                if (needsOpen) {
                    declaration = `${objcAnnotations}open class ${swiftClass.name}`;
                }
                else {
                    declaration = `${objcAnnotations}public class ${swiftClass.name}`;
                }
            }
        }
        // Inheritance
        const inheritanceParts = [];
        if (swiftClass.inheritance.extends) {
            inheritanceParts.push(swiftClass.inheritance.extends);
        }
        else if (swiftClass.type !== 'protocol') {
            // Root classes inherit from NSObject for Objective-C compatibility
            inheritanceParts.push('NSObject');
        }
        // Add protocols
        inheritanceParts.push(...swiftClass.inheritance.implements);
        if (inheritanceParts.length > 0) {
            declaration += `: ${inheritanceParts.join(', ')}`;
        }
        return `
/// ${swiftClass.name} wrapper
${declaration} {`;
    }
    generateProtocolBody(swiftClass) {
        const lines = [];
        // Protocols need to declare _ptr so conforming types can be used polymorphically
        lines.push('    var _ptr: UnsafeMutableRawPointer { get }');
        // Generate abstract method signatures for protocols
        for (const member of swiftClass.members) {
            lines.push(this.generateProtocolMember(member));
        }
        return lines;
    }
    // Class body generation
    generateClassBody(swiftClass) {
        const lines = [];
        // Only root classes declare _ptr field (as UnsafeMutableRawPointer)
        // Public readonly so users can cast as needed
        if (!swiftClass.inheritance.extends) {
            lines.push('    public let _ptr: UnsafeMutableRawPointer');
            lines.push('');
        }
        // Constructor
        lines.push(this.generatePointerConstructor(swiftClass));
        lines.push('');
        // No computed properties - subclasses just use inherited _ptr
        // Members
        let hasDispose = false;
        for (const member of swiftClass.members) {
            if (member.name === '__dispose__') {
                hasDispose = true;
                continue; // Skip the dispose marker
            }
            lines.push(this.generateMember(member, swiftClass));
            lines.push('');
        }
        // Add dispose() method instead of deinit
        if (hasDispose) {
            const disposeMethod = swiftClass.members.find(m => m.name === '__dispose__');
            if (disposeMethod) {
                // Only add override if a parent class has a destructor that we generated dispose() for
                // Abstract classes don't get dispose() generated, only concrete classes do
                let override = '';
                if (swiftClass.inheritance.extends) {
                    // Find the C++ name for this Swift class
                    let cppName = '';
                    for (const [cName, cClass] of this.classMap.entries()) {
                        if (this.toSwiftTypeName(cName) === swiftClass.name) {
                            cppName = cName;
                            break;
                        }
                    }
                    if (cppName) {
                        // Check all parents in the hierarchy to see if any has a destructor AND is concrete
                        let parentCName = this.inheritance[cppName]?.extends;
                        while (parentCName) {
                            const parentClass = this.classMap.get(parentCName);
                            // Only concrete classes get dispose() generated
                            if (parentClass && parentClass.destructor && !this.isAbstract(parentClass)) {
                                override = 'override ';
                                break;
                            }
                            // Check next parent in hierarchy
                            parentCName = this.inheritance[parentCName]?.extends;
                        }
                    }
                }
                lines.push(`    public ${override}func dispose() {`);
                lines.push(`        ${disposeMethod.implementation}`);
                lines.push('    }');
            }
        }
        return lines;
    }
    generatePointerConstructor(swiftClass) {
        const cTypeName = this.toCTypeName(swiftClass.name);
        if (swiftClass.inheritance.extends) {
            const parentTypeName = this.toCTypeName(swiftClass.inheritance.extends);
            // Subclass - NO ptr field, pass typed pointer cast to parent type
            // Use @nonobjc to prevent Objective-C selector conflicts
            return `    @nonobjc
    public init(fromPointer ptr: ${cTypeName}) {
        super.init(fromPointer: UnsafeMutableRawPointer(ptr).assumingMemoryBound(to: ${parentTypeName}_wrapper.self))
    }`;
        }
        else {
            // Root class - HAS _ptr field, store as UnsafeMutableRawPointer
            // Must call super.init() since we inherit from NSObject
            return `    public init(fromPointer ptr: ${cTypeName}) {
        self._ptr = UnsafeMutableRawPointer(ptr)
        super.init()
    }`;
        }
    }
    generateProtocolMember(member) {
        const params = member.parameters.map(p => `_ ${p.name}: ${p.swiftType}`).join(', ');
        switch (member.type) {
            case 'getter':
                // Check if this is a combined getter/setter property
                if (member.hasSetter) {
                    return `    var ${member.name}: ${member.swiftReturnType} { get set }`;
                }
                else {
                    return `    var ${member.name}: ${member.swiftReturnType} { get }`;
                }
            case 'setter':
                return `    var ${member.name}: ${member.parameters[0].swiftType} { get set }`;
            case 'method':
                if (member.swiftReturnType === 'Void') {
                    return `    func ${member.name}(${params})`;
                }
                else {
                    return `    func ${member.name}(${params}) -> ${member.swiftReturnType}`;
                }
            case 'static_method':
                // Protocols can't have method implementations in Swift
                if (member.swiftReturnType === 'Void') {
                    return `    static func ${member.name}(${params})`;
                }
                else {
                    return `    static func ${member.name}(${params}) -> ${member.swiftReturnType}`;
                }
            default:
                return '';
        }
    }
    // Member generation
    generateMember(member, swiftClass) {
        const override = member.isOverride ? 'override ' : '';
        const docComment = this.formatSwiftDocumentation(member.documentation, member);
        switch (member.type) {
            case 'constructor':
                return this.generateConstructorMember(member);
            case 'getter':
                // Check if this is a combined getter/setter property
                if (member.hasSetter && member.setterImplementation) {
                    return `${docComment}    ${override}public var ${member.name}: ${member.swiftReturnType} {
        get {
            ${member.implementation}
        }
        set {
            ${member.setterImplementation}
        }
    }`;
                }
                else {
                    return `${docComment}    ${override}public var ${member.name}: ${member.swiftReturnType} {
        ${member.implementation}
    }`;
                }
            case 'setter': {
                const param = member.parameters[0];
                return `${docComment}    ${override}public var ${member.name}: ${param.swiftType} {
        get { fatalError("Setter-only property") }
        set(newValue) {
            ${member.implementation}
        }
    }`;
            }
            case 'method':
            case 'static_method': {
                const params = member.parameters.map(p => `_ ${p.name}: ${p.swiftType}`).join(', ');
                const static_ = member.type === 'static_method' ? 'static ' : '';
                const returnClause = member.swiftReturnType !== 'Void' ? ` -> ${member.swiftReturnType}` : '';
                return `${docComment}    ${override}public ${static_}func ${member.name}(${params})${returnClause} {
        ${member.implementation}
    }`;
            }
            default:
                return '';
        }
    }
    generateConstructorMember(member) {
        const params = member.parameters.map(p => `_ ${p.name}: ${p.swiftType}`).join(', ');
        const factoryName = member.name === member.swiftReturnType ? 'convenience init' : `static func ${member.name}`;
        const docComment = this.formatSwiftDocumentation(member.documentation, member);
        if (member.name === member.swiftReturnType) {
            // Convenience initializer
            // Only root classes (not subclasses) need override for no-arg init
            // Check if this is a root class by looking at swiftClass
            const swiftClass = this.classMap.get(this.fromSwiftTypeName(member.swiftReturnType));
            const isRootClass = swiftClass && !this.inheritance[swiftClass.name]?.extends;
            const override = (params === '' && isRootClass) ? 'override ' : '';
            return `${docComment}    public ${override}convenience init(${params}) {
        ${member.implementation.replace(`return ${member.swiftReturnType}(fromPointer: ptr!)`, 'self.init(fromPointer: ptr!)')}
    }`;
        }
        else {
            // Static factory method
            return `${docComment}    public static func ${member.name}(${params}) -> ${member.swiftReturnType} {
        ${member.implementation}
    }`;
        }
    }
    formatSwiftDocumentation(doc, member) {
        if (!doc)
            return '';
        const lines = [];
        // Add summary
        if (doc.summary) {
            this.wrapDocText(doc.summary, lines, '    /// ');
        }
        // Add details if present
        if (doc.details) {
            if (doc.summary) {
                lines.push('    ///');
            }
            this.wrapDocText(doc.details, lines, '    /// ');
        }
        // Add parameter documentation (skip 'self' and 'value' for setters)
        if (doc.params && Object.keys(doc.params).length > 0) {
            const hasContent = doc.summary || doc.details;
            if (hasContent)
                lines.push('    ///');
            for (const [paramName, paramDesc] of Object.entries(doc.params)) {
                // Skip 'self' parameter documentation as it's implicit
                if (paramName === 'self' || paramName === 'this')
                    continue;
                // For setters, map the parameter documentation to 'newValue'
                if (member.type === 'setter' && member.parameters[0]) {
                    lines.push(`    /// - Parameter newValue: ${paramDesc}`);
                }
                else {
                    // Check if this parameter exists in the member
                    const paramExists = member.parameters.some(p => p.name === paramName);
                    if (paramExists) {
                        lines.push(`    /// - Parameter ${paramName}: ${paramDesc}`);
                    }
                }
            }
        }
        // Add return documentation (not for setters or constructors)
        if (doc.returns && member.type !== 'setter' && member.type !== 'constructor') {
            if (lines.length > 0)
                lines.push('    ///');
            lines.push(`    /// - Returns: ${doc.returns}`);
        }
        // Add deprecation notice
        if (doc.deprecated) {
            if (lines.length > 0)
                lines.push('    ///');
            lines.push(`    /// - Warning: Deprecated - ${doc.deprecated}`);
        }
        if (lines.length > 0) {
            return lines.join('\n') + '\n';
        }
        return '';
    }
    wrapDocText(text, lines, prefix) {
        const maxLineLength = 100;
        const maxTextLength = maxLineLength - prefix.length;
        // Split text into paragraphs
        const paragraphs = text.split('\n\n');
        for (let i = 0; i < paragraphs.length; i++) {
            if (i > 0) {
                lines.push(prefix.trim());
            }
            const paragraph = paragraphs[i].replace(/\n/g, ' ');
            const words = paragraph.split(' ');
            let currentLine = '';
            for (const word of words) {
                if (currentLine.length === 0) {
                    currentLine = word;
                }
                else if (currentLine.length + word.length + 1 <= maxTextLength) {
                    currentLine += ' ' + word;
                }
                else {
                    lines.push(prefix + currentLine);
                    currentLine = word;
                }
            }
            if (currentLine.length > 0) {
                lines.push(prefix + currentLine);
            }
        }
    }
    generateEnumCode(swiftEnum) {
        const lines = [];
        lines.push(this.generateHeader());
        lines.push('');
        lines.push('import Foundation');
        lines.push('');
        lines.push(`/// ${swiftEnum.name} enum`);
        lines.push(`public enum ${swiftEnum.name}: Int32, CaseIterable {`);
        // Write enum values
        for (const value of swiftEnum.values) {
            lines.push(`    case ${value.name} = ${value.value}`);
        }
        lines.push('');
        lines.push(`    public static func fromValue(_ value: Int32) -> ${swiftEnum.name}? {`);
        lines.push(`        return ${swiftEnum.name}(rawValue: value)`);
        lines.push('    }');
        lines.push('}');
        return lines.join('\n');
    }
    // Generate arrays.swift file
    async writeArraysFile(cArrayTypes) {
        const lines = [];
        lines.push(this.generateHeader());
        lines.push('');
        lines.push('import Foundation');
        lines.push('import SpineC');
        // Collect all imports needed for all array types
        const imports = new Set();
        for (const arrayType of cArrayTypes) {
            const elementType = this.extractArrayElementType(arrayType.name);
            if (!this.isPrimitiveArrayType(elementType)) {
                // Import the element type
                const swiftElementType = this.toSwiftTypeName(`spine_${toSnakeCase(elementType)}`);
                // We don't need separate imports in Swift, they're all in the same module
            }
        }
        // Generate all array classes
        for (const arrayType of cArrayTypes) {
            lines.push('');
            lines.push(...this.generateArrayClassLines(arrayType));
        }
        const filePath = path.join(this.outputDir, 'arrays.swift');
        fs.writeFileSync(filePath, lines.join('\n'));
    }
    // Array generation
    generateArrayClassLines(arrayType) {
        const lines = [];
        const swiftClassName = this.toSwiftTypeName(arrayType.name);
        const elementType = this.extractArrayElementType(arrayType.name);
        const cTypeName = this.toCTypeName(swiftClassName);
        lines.push(`/// ${swiftClassName} wrapper`);
        lines.push(`@objc(Spine${swiftClassName})`);
        lines.push(`@objcMembers`);
        lines.push(`public class ${swiftClassName}: NSObject {`);
        lines.push('    public let _ptr: UnsafeMutableRawPointer');
        lines.push('    private let _ownsMemory: Bool');
        lines.push('');
        // Constructor
        lines.push(`    public init(fromPointer ptr: ${cTypeName}, ownsMemory: Bool = false) {`);
        lines.push('        self._ptr = UnsafeMutableRawPointer(ptr)');
        lines.push('        self._ownsMemory = ownsMemory');
        lines.push('        super.init()');
        lines.push('    }');
        lines.push('');
        // No computed property - cast _ptr inline when needed
        lines.push('');
        // Find create methods for constructors
        const createMethod = arrayType.constructors?.find(m => m.name === `${arrayType.name}_create`);
        const createWithCapacityMethod = arrayType.constructors?.find(m => m.name === `${arrayType.name}_create_with_capacity`);
        // Add default constructor
        if (createMethod) {
            lines.push('    /// Create a new empty array');
            lines.push('    public override convenience init() {');
            lines.push(`        let ptr = ${createMethod.name}()!`);
            lines.push('        self.init(fromPointer: ptr, ownsMemory: true)');
            lines.push('    }');
            lines.push('');
        }
        // Add constructor with initial capacity
        if (createWithCapacityMethod) {
            lines.push('    /// Create a new array with the specified initial capacity');
            lines.push('    public convenience init(capacity: Int) {');
            lines.push(`        let ptr = ${createWithCapacityMethod.name}(capacity)!`);
            lines.push('        self.init(fromPointer: ptr, ownsMemory: true)');
            lines.push('    }');
            lines.push('');
        }
        // Find size and buffer methods
        const sizeMethod = arrayType.methods.find(m => m.name.endsWith('_size') && !m.name.endsWith('_set_size'));
        const bufferMethod = arrayType.methods.find(m => m.name.endsWith('_buffer'));
        const setMethod = arrayType.methods.find(m => m.name.endsWith('_set') && m.parameters.length === 3);
        const setSizeMethod = arrayType.methods.find(m => m.name.endsWith('_set_size'));
        const addMethod = arrayType.methods.find(m => m.name.endsWith('_add') && !m.name.endsWith('_add_all'));
        const clearMethod = arrayType.methods.find(m => m.name.endsWith('_clear') && !m.name.endsWith('_clear_and_add_all'));
        const removeAtMethod = arrayType.methods.find(m => m.name.endsWith('_remove_at'));
        const ensureCapacityMethod = arrayType.methods.find(m => m.name.endsWith('_ensure_capacity'));
        if (sizeMethod) {
            lines.push('    public var count: Int {');
            lines.push(`        return Int(${sizeMethod.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self)))`);
            lines.push('    }');
            lines.push('');
        }
        if (bufferMethod) {
            const swiftElementType = this.toSwiftArrayElementType(elementType);
            lines.push(`    public subscript(index: Int) -> ${swiftElementType} {`);
            lines.push('        get {');
            lines.push('            precondition(index >= 0 && index < count, "Index out of bounds")');
            lines.push(`            let buffer = ${bufferMethod.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self))!`);
            // Handle different element types
            if (elementType === 'int') {
                lines.push('            return buffer[Int(index)]');
            }
            else if (elementType === 'float') {
                lines.push('            return buffer[Int(index)]');
            }
            else if (elementType === 'bool') {
                lines.push('            return buffer[Int(index)] != 0');
            }
            else if (elementType === 'unsigned_short') {
                lines.push('            return buffer[Int(index)]');
            }
            else if (elementType === 'property_id') {
                lines.push('            return buffer[Int(index)]');
            }
            else {
                // For object types
                const swiftType = this.toSwiftTypeName(`spine_${toSnakeCase(elementType)}`);
                const cElementType = `spine_${toSnakeCase(elementType)}`;
                const cClass = this.classMap.get(cElementType);
                const elementCType = this.getArrayElementCType(arrayType.name);
                lines.push(`            let elementPtr = buffer[Int(index)]`);
                if (cClass && this.isAbstract(cClass)) {
                    // Use RTTI to determine concrete type
                    lines.push('            guard let ptr = elementPtr else { return nil }');
                    const rttiCode = this.generateRttiBasedInstantiation(swiftType, 'ptr', cClass);
                    lines.push(`            ${rttiCode}`);
                }
                else {
                    lines.push(`            return elementPtr.map { ${swiftType}(fromPointer: $0) }`);
                }
            }
            lines.push('        }');
            // Setter if available
            if (setMethod) {
                lines.push('        set {');
                lines.push('            precondition(index >= 0 && index < count, "Index out of bounds")');
                const param = setMethod.parameters[2]; // The value parameter
                const nullableParam = { ...param, isNullable: !this.isPrimitiveArrayType(elementType) };
                const convertedValue = this.convertSwiftToC('newValue', nullableParam);
                lines.push(`            ${setMethod.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self), index, ${convertedValue})`);
                lines.push('        }');
            }
            lines.push('    }');
            lines.push('');
        }
        // Add method if available
        if (addMethod) {
            const swiftElementType = this.toSwiftArrayElementType(elementType);
            lines.push('    /// Adds a value to the end of this array');
            lines.push(`    public func add(_ value: ${swiftElementType}) {`);
            const param = addMethod.parameters[1];
            const nullableParam = { ...param, isNullable: !this.isPrimitiveArrayType(elementType) };
            const convertedValue = this.convertSwiftToC('value', nullableParam);
            lines.push(`        ${addMethod.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self), ${convertedValue})`);
            lines.push('    }');
            lines.push('');
        }
        // Clear method if available
        if (clearMethod) {
            lines.push('    /// Removes all elements from this array');
            lines.push('    public func clear() {');
            lines.push(`        ${clearMethod.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self))`);
            lines.push('    }');
            lines.push('');
        }
        // RemoveAt method if available
        if (removeAtMethod) {
            const swiftElementType = this.toSwiftArrayElementType(elementType);
            lines.push('    /// Removes the element at the given index');
            lines.push(`    @discardableResult`);
            lines.push(`    public func removeAt(_ index: Int) -> ${swiftElementType} {`);
            lines.push('        precondition(index >= 0 && index < count, "Index out of bounds")');
            lines.push('        let value = self[index]');
            lines.push(`        ${removeAtMethod.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self), index)`);
            lines.push('        return value');
            lines.push('    }');
            lines.push('');
        }
        // Set size method
        if (setSizeMethod) {
            lines.push('    /// Sets the size of this array');
            lines.push('    public var length: Int {');
            lines.push('        get { count }');
            lines.push('        set {');
            if (this.isPrimitiveArrayType(elementType)) {
                let defaultValue = '0';
                if (elementType === 'float')
                    defaultValue = '0.0';
                else if (elementType === 'bool')
                    defaultValue = 'false';
                lines.push(`            ${setSizeMethod.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self), newValue, ${defaultValue})`);
            }
            else {
                lines.push(`            ${setSizeMethod.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self), newValue, nil)`);
            }
            lines.push('        }');
            lines.push('    }');
            lines.push('');
        }
        // EnsureCapacity method if available
        if (ensureCapacityMethod) {
            lines.push('    /// Ensures this array has at least the given capacity');
            lines.push('    public func ensureCapacity(_ capacity: Int) {');
            lines.push(`        ${ensureCapacityMethod.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self), capacity)`);
            lines.push('    }');
            lines.push('');
        }
        // Deinit
        if (arrayType.destructor) {
            lines.push('    deinit {');
            lines.push('        if _ownsMemory {');
            lines.push(`            ${arrayType.destructor.name}(_ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self))`);
            lines.push('        }');
            lines.push('    }');
        }
        lines.push('}');
        return lines;
    }
    extractArrayElementType(arrayTypeName) {
        const match = arrayTypeName.match(/spine_array_(.+)/);
        if (match) {
            return match[1];
        }
        return 'Any';
    }
    getArrayElementCType(arrayTypeName) {
        const elementType = this.extractArrayElementType(arrayTypeName);
        if (this.isPrimitiveArrayType(elementType)) {
            if (elementType === 'int')
                return 'Int32';
            if (elementType === 'float')
                return 'Float';
            if (elementType === 'unsigned_short')
                return 'UInt16';
            if (elementType === 'property_id')
                return 'Int64';
            return elementType;
        }
        // For object types, return the C type name
        return `spine_${elementType}`;
    }
    toSwiftArrayElementType(elementType) {
        if (this.isPrimitiveArrayType(elementType)) {
            if (elementType === 'int')
                return 'Int32';
            if (elementType === 'float')
                return 'Float';
            if (elementType === 'bool')
                return 'Bool';
            if (elementType === 'unsigned_short')
                return 'UInt16';
            if (elementType === 'property_id')
                return 'Int64';
        }
        // For object types, make them optional since arrays can contain nulls
        const swiftType = this.toSwiftTypeName(`spine_${toSnakeCase(elementType)}`);
        return swiftType + '?';
    }
    isPrimitiveArrayType(elementType) {
        return ['int', 'float', 'bool', 'unsigned_short', 'property_id'].includes(elementType.toLowerCase());
    }
    // Helper methods
    sortByInheritance(cTypes) {
        const sorted = [];
        const processed = new Set();
        const processClass = (cType) => {
            if (processed.has(cType.name)) {
                return;
            }
            // Process concrete parent first (skip interfaces)
            const inheritanceInfo = this.inheritance[cType.name];
            if (inheritanceInfo?.extends) {
                const parent = this.classMap.get(inheritanceInfo.extends);
                if (parent) {
                    processClass(parent);
                }
            }
            // Process interface dependencies
            for (const interfaceName of inheritanceInfo?.mixins || []) {
                const interfaceClass = this.classMap.get(interfaceName);
                if (interfaceClass) {
                    processClass(interfaceClass);
                }
            }
            sorted.push(cType);
            processed.add(cType.name);
        };
        for (const cType of cTypes) {
            processClass(cType);
        }
        return sorted;
    }
    hasRttiMethod(cType) {
        return cType.methods.some(m => m.name === `${cType.name}_rtti` && m.parameters.length === 0);
    }
    collectImports(cType) {
        const imports = new Set();
        // In Swift, we don't need to import individual files within the same module
        // All generated types are in the same module
        return Array.from(imports).sort();
    }
    isMethodOverride(method, cType) {
        // Static methods cannot be overridden
        const isStatic = method.parameters.length === 0 ||
            (method.parameters[0].name !== 'self' &&
                !method.parameters[0].cType.startsWith(cType.name));
        if (isStatic) {
            return false;
        }
        // In Swift, we only use 'override' when overriding a superclass method,
        // NOT when implementing a protocol requirement
        // Check if this method exists in parent CLASS (not protocol/interface)
        const parentName = this.inheritance[cType.name]?.extends;
        if (parentName) {
            const parent = this.classMap.get(parentName);
            if (parent) {
                const methodSuffix = this.getMethodSuffix(method.name, cType.name);
                const parentMethodName = `${parentName}_${methodSuffix}`;
                if (parent.methods.some(m => m.name === parentMethodName)) {
                    return true;
                }
            }
        }
        // DO NOT check interfaces/protocols - implementing protocol requirements doesn't use 'override'
        // Protocol conformance is handled without the override keyword in Swift
        return false;
    }
    // Utility methods
    toSwiftTypeName(cTypeName) {
        if (cTypeName.startsWith('spine_')) {
            const name = cTypeName.slice(6);
            return this.toPascalCase(name);
        }
        return this.toPascalCase(cTypeName);
    }
    toCTypeName(swiftTypeName) {
        return `spine_${toSnakeCase(swiftTypeName)}`;
    }
    toSwiftMethodName(cMethodName, cTypeName) {
        const prefix = `${cTypeName}_`;
        if (cMethodName.startsWith(prefix)) {
            return this.toCamelCase(cMethodName.slice(prefix.length));
        }
        return this.toCamelCase(cMethodName);
    }
    toSwiftEnumValueName(cValueName, cEnumName) {
        const enumNameUpper = cEnumName.toUpperCase();
        const prefixes = [
            `SPINE_${enumNameUpper}_`,
            `${enumNameUpper}_`,
            'SPINE_'
        ];
        let name = cValueName;
        for (const prefix of prefixes) {
            if (name.startsWith(prefix)) {
                name = name.slice(prefix.length);
                break;
            }
        }
        const enumValue = this.toCamelCase(name.toLowerCase());
        // Handle Swift reserved words
        const swiftReservedWords = ['in', 'out', 'repeat', 'return', 'throw', 'continue', 'break', 'case', 'default', 'where', 'while', 'for', 'if', 'else', 'switch'];
        if (swiftReservedWords.includes(enumValue)) {
            return `\`${enumValue}\``;
        }
        return enumValue;
    }
    toSwiftReturnType(cType, nullable) {
        let baseType;
        if (cType === 'void')
            return 'Void';
        if (cType === 'char*' || cType === 'char *' || cType === 'const char*' || cType === 'const char *')
            baseType = 'String';
        else if (cType === 'float' || cType === 'double')
            baseType = 'Float';
        else if (cType === 'size_t')
            baseType = 'Int';
        else if (cType === 'int' || cType === 'int32_t' || cType === 'uint32_t')
            baseType = 'Int32';
        else if (cType === 'bool')
            baseType = 'Bool';
        // Handle primitive pointer types
        else if (cType === 'void*' || cType === 'void *')
            baseType = 'UnsafeMutableRawPointer';
        else if (cType === 'float*' || cType === 'float *')
            baseType = 'UnsafeMutablePointer<Float>';
        else if (cType === 'uint32_t*' || cType === 'uint32_t *')
            baseType = 'UnsafeMutablePointer<UInt32>';
        else if (cType === 'uint16_t*' || cType === 'uint16_t *')
            baseType = 'UnsafeMutablePointer<UInt16>';
        else if (cType === 'int*' || cType === 'int *')
            baseType = 'UnsafeMutablePointer<Int32>';
        else
            baseType = this.toSwiftTypeName(cType);
        return nullable ? `${baseType}?` : baseType;
    }
    toSwiftParameterType(param) {
        if (param.cType === 'char*' || param.cType === 'char *' || param.cType === 'const char*' || param.cType === 'const char *') {
            return 'String';
        }
        // Handle void* parameters
        if (param.cType === 'void*' || param.cType === 'void *') {
            return 'UnsafeMutableRawPointer';
        }
        return this.toSwiftReturnType(param.cType, param.isNullable);
    }
    convertSwiftToC(swiftValue, param) {
        if (param.cType === 'char*' || param.cType === 'char *' || param.cType === 'const char*' || param.cType === 'const char *') {
            return swiftValue;
        }
        if (this.enumNames.has(param.cType)) {
            // Convert Swift enum to C enum
            // C enums in Swift are their own types with rawValue
            if (param.isNullable) {
                return `${param.cType}(rawValue: UInt32(${swiftValue}?.rawValue ?? 0))`;
            }
            return `${param.cType}(rawValue: UInt32(${swiftValue}.rawValue))`;
        }
        if (param.cType.startsWith('spine_')) {
            // Cast the raw pointer to the expected type
            const cTypeName = this.toCTypeName(this.toSwiftTypeName(param.cType));
            if (param.isNullable) {
                return `${swiftValue}?._ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self)`;
            }
            return `${swiftValue}._ptr.assumingMemoryBound(to: ${cTypeName}_wrapper.self)`;
        }
        // size_t parameters are already Int in Swift, no conversion needed
        if (param.cType === 'size_t') {
            return swiftValue;
        }
        // Keep int32_t and int as-is since Swift Int32 maps to these
        if (param.cType === 'int' || param.cType === 'int32_t') {
            return swiftValue;
        }
        return swiftValue;
    }
    generateReturnConversion(cReturnType, resultVar, nullable) {
        if (cReturnType === 'char*' || cReturnType === 'char *' || cReturnType === 'const char*' || cReturnType === 'const char *') {
            if (nullable) {
                return `return ${resultVar}.map { String(cString: $0) }`;
            }
            return `return String(cString: ${resultVar}!)`;
        }
        if (this.enumNames.has(cReturnType)) {
            const swiftType = this.toSwiftTypeName(cReturnType);
            // C enums in Swift are their own types with .rawValue property
            if (nullable) {
                return `return ${resultVar}.map { ${swiftType}(rawValue: Int32($0.rawValue)) }`;
            }
            return `return ${swiftType}(rawValue: Int32(${resultVar}.rawValue))!`;
        }
        if (cReturnType.startsWith('spine_array_')) {
            const swiftType = this.toSwiftTypeName(cReturnType);
            if (nullable) {
                return `return ${resultVar}.map { ${swiftType}(fromPointer: $0) }`;
            }
            return `return ${swiftType}(fromPointer: ${resultVar}!)`;
        }
        if (cReturnType.startsWith('spine_')) {
            const swiftType = this.toSwiftTypeName(cReturnType);
            const cClass = this.classMap.get(cReturnType);
            if (nullable) {
                if (cClass && this.isAbstract(cClass)) {
                    return `guard let ptr = ${resultVar} else { return nil }
        ${this.generateRttiBasedInstantiation(swiftType, 'ptr', cClass)}`;
                }
                return `return ${resultVar}.map { ${swiftType}(fromPointer: $0) }`;
            }
            else {
                if (cClass && this.isAbstract(cClass)) {
                    return this.generateRttiBasedInstantiation(swiftType, `${resultVar}!`, cClass);
                }
                return `return ${swiftType}(fromPointer: ${resultVar}!)`;
            }
        }
        return `return ${resultVar}`;
    }
    generateRttiBasedInstantiation(abstractType, resultVar, abstractClass) {
        const lines = [];
        const concreteSubclasses = this.getConcreteSubclasses(abstractClass.name);
        if (concreteSubclasses.length === 0) {
            return `fatalError("Cannot instantiate abstract class ${abstractType} from pointer - no concrete subclasses found")`;
        }
        lines.push(`let rtti = ${abstractClass.name}_get_rtti(${resultVar})`);
        lines.push(`let rttiClassName = String(cString: spine_rtti_get_class_name(rtti)!)`);
        lines.push(`switch rttiClassName {`);
        for (const subclass of concreteSubclasses) {
            const swiftSubclass = this.toSwiftTypeName(subclass);
            // RTTI returns the C++ class name in PascalCase (e.g., "TransformConstraint")
            // We need to convert spine_transform_constraint -> TransformConstraint
            const cppClassName = this.toPascalCase(subclass.replace('spine_', ''));
            lines.push(`case "${cppClassName}":`);
            // Use C cast function to handle pointer adjustment
            const toType = subclass.replace('spine_', '');
            const castFunctionName = `${abstractClass.name}_cast_to_${toType}`;
            lines.push(`    let castedPtr = ${castFunctionName}(${resultVar})`);
            lines.push(`    return ${swiftSubclass}(fromPointer: castedPtr!)`);
        }
        lines.push(`default:`);
        lines.push(`    fatalError("Unknown concrete type: \\(rttiClassName) for abstract class ${abstractType}")`);
        lines.push(`}`);
        return lines.join('\n        ');
    }
    getConcreteSubclasses(abstractClassName) {
        const concreteSubclasses = [];
        for (const [childName, supertypeList] of Object.entries(this.supertypes || {})) {
            if (supertypeList.includes(abstractClassName)) {
                const childClass = this.classMap.get(childName);
                if (childClass && !this.isAbstract(childClass)) {
                    concreteSubclasses.push(childName);
                }
            }
        }
        return concreteSubclasses;
    }
    isAbstract(cType) {
        return cType.cppType.isAbstract === true;
    }
    getConstructorName(constr, cType) {
        const swiftClassName = this.toSwiftTypeName(cType.name);
        const cTypeName = this.toCTypeName(swiftClassName);
        let constructorName = constr.name.replace(`${cTypeName}_create`, '');
        if (constructorName) {
            if (/^\d+$/.test(constructorName)) {
                if (cType.name === 'spine_color' && constr.name === 'spine_color_create2') {
                    constructorName = 'fromRGBA';
                }
                else if (constr.parameters.length > 0) {
                    const firstParamType = constr.parameters[0].cType.replace('*', '').trim();
                    if (firstParamType === cType.name) {
                        constructorName = 'from';
                    }
                    else {
                        constructorName = `variant${constructorName}`;
                    }
                }
                else {
                    constructorName = `variant${constructorName}`;
                }
            }
            else if (constructorName.startsWith('_')) {
                constructorName = this.toCamelCase(constructorName.slice(1));
            }
        }
        return constructorName || swiftClassName;
    }
    extractPropertyName(methodName, typeName) {
        const prefix = `${typeName}_`;
        let name = methodName.startsWith(prefix) ? methodName.slice(prefix.length) : methodName;
        if (name.startsWith('get_')) {
            name = name.slice(4);
        }
        else if (name.startsWith('set_')) {
            name = name.slice(4);
        }
        if (name === 'update_cache') {
            return 'updateCacheList';
        }
        const typeNames = ['int', 'float', 'double', 'bool', 'string'];
        if (typeNames.includes(name.toLowerCase())) {
            return `${this.toCamelCase(name)}Value`;
        }
        let propertyName = this.toCamelCase(name);
        // Rename properties that conflict with NSObject
        if (propertyName === 'className') {
            return 'rttiClassName';
        }
        if (propertyName === 'hash') {
            return 'hashString';
        }
        return propertyName;
    }
    hasRawPointerParameters(method) {
        for (const param of method.parameters) {
            if (this.isRawPointer(param.cType)) {
                return true;
            }
        }
        return false;
    }
    isRawPointer(cType) {
        if (cType === 'char*' || cType === 'char *' || cType === 'const char*' || cType === 'const char *') {
            return false;
        }
        if (cType.includes('*')) {
            const cleanType = cType.replace('*', '').trim();
            if (!cleanType.startsWith('spine_')) {
                return true;
            }
        }
        return false;
    }
    isMethodInherited(method, cType) {
        const parentName = this.inheritance[cType.name]?.extends;
        if (!parentName) {
            return false;
        }
        const parent = this.classMap.get(parentName);
        if (!parent) {
            return false;
        }
        const methodSuffix = this.getMethodSuffix(method.name, cType.name);
        // Don't consider dispose methods as inherited - they're type-specific
        if (methodSuffix === 'dispose') {
            return false;
        }
        const parentMethodName = `${parentName}_${methodSuffix}`;
        const hasInParent = parent.methods.some(m => m.name === parentMethodName);
        if (hasInParent) {
            return true;
        }
        return this.isMethodInherited(method, parent);
    }
    getMethodSuffix(methodName, typeName) {
        const prefix = `${typeName}_`;
        if (methodName.startsWith(prefix)) {
            return methodName.slice(prefix.length);
        }
        return methodName;
    }
    renumberMethods(methods, typeName) {
        const result = [];
        const methodGroups = new Map();
        for (const method of methods) {
            const match = method.name.match(/^(.+?)_(\d+)$/);
            if (match) {
                const baseName = match[1];
                if (!methodGroups.has(baseName)) {
                    methodGroups.set(baseName, []);
                }
                methodGroups.get(baseName).push(method);
            }
            else {
                result.push({ method });
            }
        }
        for (const [baseName, groupedMethods] of methodGroups) {
            if (groupedMethods.length === 1) {
                const method = groupedMethods[0];
                const swiftMethodName = this.toSwiftMethodName(baseName, typeName);
                result.push({ method, renamedMethod: swiftMethodName });
            }
            else {
                groupedMethods.sort((a, b) => {
                    const aNum = parseInt(a.name.match(/_(\d+)$/)[1]);
                    const bNum = parseInt(b.name.match(/_(\d+)$/)[1]);
                    return aNum - bNum;
                });
                for (let i = 0; i < groupedMethods.length; i++) {
                    const method = groupedMethods[i];
                    const newNumber = i + 1;
                    const currentNumber = parseInt(method.name.match(/_(\d+)$/)[1]);
                    const baseSwiftName = this.toSwiftMethodName(baseName, typeName);
                    if (i === 0) {
                        // First method in the group - remove the number
                        result.push({ method, renamedMethod: baseSwiftName });
                    }
                    else if (newNumber !== currentNumber) {
                        // Need to renumber
                        result.push({ method, renamedMethod: `${baseSwiftName}${newNumber}` });
                    }
                    else {
                        // Number is correct, no renamed method needed
                        result.push({ method });
                    }
                }
            }
        }
        return result;
    }
    async writeExportFile(classes, enums) {
        // Swift doesn't need an export file like Dart does
        // All public types are automatically available within the module
        return;
    }
    fromSwiftTypeName(swiftTypeName) {
        // Convert Swift class name back to C type name
        return `spine_${toSnakeCase(swiftTypeName)}`;
    }
    toPascalCase(str) {
        return str.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
    toCamelCase(str) {
        const pascal = this.toPascalCase(str);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }
}
