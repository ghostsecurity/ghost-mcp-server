# Creative Usage Examples

This document showcases powerful ways to use the Ghost Security MCP server with AI assistants to get insights from your security findings.

## Example 1: Security Posture Overview

**Prompt:**
```
"Analyze all my security findings and give me an executive summary: What are my top risks? 
Which vulnerabilities should I fix first based on severity and exploitability? 
Are there patterns indicating systematic security issues across my codebase?"
```

**What this does:**
- Gets comprehensive findings data using `ghostsecurity_get_findings`
- Uses AI reasoning to prioritize risks by severity and business impact
- Identifies patterns that might indicate architectural or training issues
- Provides actionable remediation strategy

## Example 2: Developer-Focused Security Analysis  

**Prompt:**
```
"Group my security findings by code module and file location. Help me understand which parts 
of the codebase need security training or architecture review. Identify if certain types 
of vulnerabilities cluster in specific areas or files."
```

**What this does:**
- Analyzes findings by location using `ghostsecurity_get_findings`
- Groups vulnerabilities by module, file, and vulnerability class
- Identifies hotspots that may need refactoring or additional security controls
- Suggests targeted developer training based on vulnerability patterns

## Example 3: Compliance & Risk Assessment

**Prompt:**
```
"Review my findings from a compliance perspective. Which findings would fail a SOC2 audit? 
What OWASP Top 10 categories am I vulnerable to? Create a prioritized remediation timeline 
based on business risk, focusing on authentication and authorization issues first."
```

**What this does:**
- Reviews findings through compliance lens using `ghostsecurity_get_findings`
- Maps vulnerabilities to compliance frameworks (SOC2, OWASP Top 10)
- Creates timeline based on compliance deadlines and business risk
- Prioritizes auth-related issues that pose immediate compliance risks

## Tips for Effective Usage

### 🎯 Be Specific About Your Goals
Instead of "show me findings," try "show me all authentication-related high severity findings that were created in the last 30 days"

### 🔍 Ask for Analysis, Not Just Data
The MCP server provides raw data - leverage AI to analyze patterns, suggest priorities, and create actionable insights

### 📊 Request Different Perspectives
- **Developer perspective:** Focus on code quality and training needs
- **Security perspective:** Focus on threat modeling and attack vectors  
- **Business perspective:** Focus on compliance, risk, and resource allocation
- **DevOps perspective:** Focus on deployment safety and infrastructure security

### 🚀 Combine Multiple Tools
Chain together different MCP tools in a single conversation:
1. `ghostsecurity_get_repositories` - understand your repository landscape
2. `ghostsecurity_get_repository_findings` - dive deep into specific repos
3. `ghostsecurity_get_finding` - get detailed information on critical issues
4. `ghostsecurity_update_finding_status` - update status as you remediate

### 💡 Advanced Analysis Ideas

**Trend Analysis:**
"Compare findings from the last 3 months - are we improving our security posture? Which vulnerability types are increasing/decreasing?"

**Team Performance:**
"Based on code locations, which teams need additional security training? Are certain coding patterns leading to more vulnerabilities?"

**Architecture Review:**
"Identify security findings that suggest architectural problems rather than simple code fixes. What systematic changes should we make?"

**Prioritization Matrix:**
"Create a 2x2 matrix of findings based on severity vs. effort to fix. What are our 'quick wins' and 'major projects'?"