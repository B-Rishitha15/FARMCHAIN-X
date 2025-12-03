import React, { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const STORAGE_KEY = 'qualityScoresConfig';

const QualityScore = () => {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ name: '', score: '' });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load quality scores config', e);
    }
  }, []);

  const persist = (next) => {
    setEntries(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save quality scores config', e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdate = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const score = parseFloat(form.score);

    if (!name || isNaN(score)) return;

    const existingIndex = entries.findIndex(
      (entry) => entry.name.toLowerCase() === name.toLowerCase()
    );

    const next = [...entries];
    if (existingIndex >= 0) {
      next[existingIndex] = { name, score };
    } else {
      next.push({ name, score });
    }

    persist(nehixt);
    setForm({ name: 'Potato', score: '92' ,'Mango': '88' ,'Tomato': '75' ,'Carrot': '70'});
    setForm({ name: 'Mango', score: '88' });
    setForm({ name: 'Tomato', score: '75' });
    setForm({ name: 'Carrot', score: '70' });
  };

  const handleDelete = (name) => {
    const next = entries.filter(
      (entry) => entry.name.toLowerCase() !== name.toLowerCase()
    );
    persist(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Quality Score Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Define default quality scores for crops. When you upload a crop with
          a matching name, its quality score will default to the configured
          value; otherwise it will use 67.
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Add / Update Quality Score</Card.Title>
          <Card.Description>
            Specify the crop name and its default quality score (0 - 100).
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form
            onSubmit={handleAddOrUpdate}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
          >
            <Input
              label="Crop Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Potato"
              required
            />
            <Input
              label="Quality Score"
              name="score"
              type="number"
              min="0"
              max="100"
              value={form.score}
              onChange={handleChange}
              placeholder="e.g., 90"
              required
            />
            <div>
              <Button type="submit" className="w-full">
                Save
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Configured Scores</Card.Title>
          <Card.Description>
            Existing crop quality mappings currently stored in this browser.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No quality scores configured yet.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {entry.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Quality Score: {entry.score}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(entry.name)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default QualityScore;


