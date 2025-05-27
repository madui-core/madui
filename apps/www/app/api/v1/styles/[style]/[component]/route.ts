import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parser as StreamParser } from 'stream-json';
import { chain } from 'stream-chain';
import { pick } from 'stream-json/filters/Pick';
import { streamValues } from 'stream-json/streamers/StreamValues';
import { streamObject } from 'stream-json/streamers/StreamObject';

// Define a type for the JSON data (adjust based on your button.json structure)
type ButtonData = Record<string, any>;

// Helper function to stream specific keys from JSON
async function streamJsonKeys(filePath: string, targetKeys: string[]): Promise<Partial<ButtonData>> {
  return new Promise((resolve, reject) => {
    const result: Partial<ButtonData> = {};
    let foundKeys = 0;
    const expectedKeys = targetKeys.length;

    // Create a pipeline: read file -> parse JSON -> pick specific keys -> collect values
    const pipeline = chain([
      fs.createReadStream(filePath),
      StreamParser(), // Parse JSON stream
      pick({ filter: (stack: any) => {
        // The stack contains the path information
        // For top-level keys, we check if the key is in our target list
        if (stack.length === 1 && typeof stack[0] === 'string') {
          return targetKeys.includes(stack[0]);
        }
        return false;
      }}), // Filter only target keys
      streamValues(), // Stream the values
    ]);

    pipeline.on('data', (data: { value: any; key: string }) => {
      if (data.value !== undefined && data.key) {
        result[data.key] = data.value;
        foundKeys++;
        // Stop streaming if all target keys are found (optimization)
        if (foundKeys === expectedKeys) {
          pipeline.destroy();
          resolve(result);
        }
      }
    });

    pipeline.on('end', () => {
      resolve(result);
    });

    pipeline.on('error', (error) => reject(error));
  });
}

// Helper function to get all top-level keys (requires full parse)
async function streamJsonKeysList(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const keys: string[] = [];

    const pipeline = chain([
      fs.createReadStream(filePath),
      StreamParser(), // Parse JSON stream
      streamObject(), // Stream object key-value pairs
    ]);

    pipeline.on('data', (data: { key: string; value: any }) => {
      if (data.key !== undefined) {
        keys.push(data.key);
      }
    });

    pipeline.on('end', () => resolve(keys));
    pipeline.on('error', (error) => reject(error));
  });
}

export async function GET(request: Request, { params }: { params: { style: string, component: string } }) {
  try {
    const { style, component } = params;
    const filePath = path.join(process.cwd(), 'public', 'r', 'styles', style, component);
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const keys = searchParams.get('keys');
    const getKeys = searchParams.get('getKeys');

    // Case 1: Get all keys
    if (getKeys === 'true') {
      const allKeys = await streamJsonKeysList(filePath);
      return NextResponse.json({ keys: allKeys }, {
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      });
    }

    // Case 2: Fetch multiple keys
    if (keys) {
      const keyArray: string[] = keys.split(',').map((k) => k.trim());
      if (keyArray.some((k) => ['__proto__', 'constructor', 'prototype'].includes(k))) {
        return NextResponse.json({ error: 'Invalid key in keys' }, { status: 400 });
      }
      const result = await streamJsonKeys(filePath, keyArray);
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      });
    }

    // Case 3: Fetch single key
    if (key) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
      }
      const result = await streamJsonKeys(filePath, [key]);
      if (!(key in result)) {
        return NextResponse.json({ error: `Key "${key}" not found in ${params.component}` }, { status: 404 });
      }
      return NextResponse.json(result[key], {
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      });
    }

    // No valid parameters provided
    return NextResponse.json(
      { error: 'Provide key, keys, or getKeys parameter' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to fetch data: ${error.message}` },
      { status: 500 }
    );
  }
}