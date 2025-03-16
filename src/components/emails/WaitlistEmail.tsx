import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface EmailTemplateProps {
  name: string;
  email: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  name,
  email,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the Idealite Waitlist!</Preview>
      <Body
        style={{
          fontFamily: "Arial, sans-serif",
          margin: "0",
          padding: "0",
          backgroundColor: "#f6f9fc",
        }}
      >
        <Container style={container}>
          <Container style={{ textAlign: "center", marginTop: "20px" }}>
            <img
              src="https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreicl7lxpeag72txxbbrh4on5wcp7d7xxzomapsyrtphtsim56aei5m"
              alt="Idealite Logo"
              width="150"
              height="auto"
              style={{ margin: "0 auto" }}
            />
          </Container>
          <Heading style={h1}>Welcome to Idealite!</Heading>
          <Text style={text}>Hello {name},</Text>
          <Text style={text}>
            Thank you for joining our waitlist! We're excited to have you as
            part of our growing community.
          </Text>
          <Text style={text}>
            Idealite is the MMO where knowledge is your superpower. Learn,
            create memory palaces, achieve, and battle with real-time knowledge
            tests.
          </Text>
          <Text style={text}>
            We'll keep you updated on our progress and let you know as soon as
            you can access the platform.
          </Text>
          <Text style={text}>
            If you have any questions, just reply to this email!
          </Text>
          <Text style={text}>
            Best,
            <br />
            The Idealite Team
          </Text>
          <Text style={footer}>
            This email was sent to {email}. If you didn't sign up for Idealite,
            you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f9f9f9",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  maxWidth: "600px",
};

const h1 = {
  color: "#FF9500",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  lineHeight: "1.5",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "16px 0",
};

const footer = {
  color: "#898989",
  fontSize: "12px",
  marginTop: "30px",
  fontStyle: "italic",
};
