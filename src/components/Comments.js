import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { USER_NAME, getPeople, updateDocs } from '../store';
import { colors, fonts, gradients, radius } from '../theme';
import { initials } from '../lib/format';
import { relTime } from '../lib/dates';
import Tap from './Tap';

const uid = () => `c-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// WhatsApp-style per-doc comments: bubbles, @-tags, edit/delete.
export default function Comments({ doc, onInputFocus }) {
  const people = getPeople();
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('me');
  const [editingId, setEditingId] = useState(null);
  const [atQuery, setAtQuery] = useState(null); // text after the active @, or null

  const authors = [{ id: 'me', name: USER_NAME, color: colors.coral }, ...people];
  const authorOf = (id) => authors.find((a) => a.id === id) || authors[0];
  const taggable = authors;

  // Track @-mention query: text after the last @ (if no space/newline since).
  const handleText = (t) => {
    setText(t);
    const m = t.match(/@([\w']*)$/);
    setAtQuery(m ? m[1] : null);
  };

  const pickAtName = (name) => {
    // Replace the trailing @query with @Name + space.
    setText((t) => t.replace(/@[\w']*$/, `@${name} `));
    setAtQuery(null);
  };

  const atSuggestions = atQuery === null ? [] : taggable.filter((a) =>
    a.name.toLowerCase().startsWith(atQuery.toLowerCase())
  );

  const saveComments = (comments) =>
    updateDocs((ds) => ds.map((d) => (d.id === doc.id ? { ...d, comments } : d)));

  const send = () => {
    const t = text.trim();
    if (!t) return;
    if (editingId) {
      saveComments(doc.comments.map((c) => (c.id === editingId ? { ...c, text: t, author } : c)));
      setEditingId(null);
    } else {
      saveComments([...doc.comments, { id: uid(), author, text: t, ts: Date.now() }]);
    }
    setText('');
    setAtQuery(null);
  };

  const bubbleMenu = (c) => {
    const mine = c.author === 'me';
    Alert.alert('Comment', undefined, [
      ...(mine ? [{ text: 'Edit', onPress: () => { setText(c.text); setAuthor(c.author); setEditingId(c.id); } }] : []),
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete this comment?', undefined, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => saveComments(doc.comments.filter((x) => x.id !== c.id)) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Highlight @mentions: pink on white bubbles, underlined white on pink.
  const mentionify = (t, mine) => {
    const names = taggable.map((a) => a.name);
    const parts = t.split(/(@[\w' ]+?)(?=\s|$|[.,!?])/g);
    return parts.map((p, i) => {
      const hit = p.startsWith('@') && names.some((n) => p === `@${n}`);
      if (!hit) return <Text key={i}>{p}</Text>;
      return (
        <Text
          key={i}
          style={mine ? styles.mentionMine : styles.mentionTheirs}
        >
          {p}
        </Text>
      );
    });
  };

  const tag = (name) => setText((t) => `${t}@${name} `);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Comments</Text>

      {doc.comments.length === 0 && (
        <Text style={styles.none}>No comments yet — start the conversation.</Text>
      )}
      {doc.comments.map((c) => {
        const mine = c.author === 'me';
        const a = authorOf(c.author);
        return (
          <View key={c.id} style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
            {!mine && (
              <View style={[styles.avatar, { backgroundColor: a.color }]}>
                <Text style={styles.avatarText}>{initials(a.name)}</Text>
              </View>
            )}
            <Tap
              style={styles.bubbleWrap}
              onPress={() => bubbleMenu(c)}
            >
              {!mine && <Text style={[styles.author, { color: a.color }]}>{a.name}</Text>}
              {mine ? (
                <LinearGradient colors={gradients.brand} style={styles.bubbleMine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.textMine}>{mentionify(c.text, true)}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.bubbleTheirs}>
                  <Text style={styles.textTheirs}>{mentionify(c.text, false)}</Text>
                </View>
              )}
              <Text style={[styles.ts, mine && styles.tsMine]}>{relTime(c.ts)}</Text>
            </Tap>
          </View>
        );
      })}

      <Text style={styles.commentAs}>Comment as</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.authors}>
        {authors.map((a) => (
          <Tap
            key={a.id}
            style={[styles.authorChip, author === a.id && styles.authorChipOn]}
            onPress={() => setAuthor(a.id)}
          >
            <View style={[styles.dot, { backgroundColor: a.color }]} />
            <Text style={[styles.authorChipText, author === a.id && styles.authorChipTextOn]}>
              {a.id === 'me' ? 'Me' : a.name}
            </Text>
          </Tap>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tags}>
        {taggable.map((a) => (
          <Tap key={a.id} style={styles.tag} onPress={() => tag(a.name)}>
            <Text style={styles.tagText}>@{a.id === 'me' ? USER_NAME : a.name}</Text>
          </Tap>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <View style={styles.inputWrap}>
          {atSuggestions.length > 0 && (
            <View style={styles.suggestBox}>
              {atSuggestions.map((a) => (
                <Tap
                  key={a.id}
                  style={styles.suggestRow}
                  onPress={() => pickAtName(a.name)}
                >
                  <View style={[styles.dot, { backgroundColor: a.color }]} />
                  <Text style={styles.suggestText}>{a.name}</Text>
                </Tap>
              ))}
            </View>
          )}
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleText}
            onFocus={onInputFocus}
            placeholder={editingId ? 'Edit your comment…' : 'Write a comment…'}
            placeholderTextColor={colors.muted}
            multiline
          />
        </View>
        <Tap onPress={send} disabled={!text.trim()}>
          <LinearGradient
            colors={text.trim() ? gradients.brand : ['#e8dfe3', '#e8dfe3']}
            style={styles.send}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.sendText}>{editingId ? '✓' : '↑'}</Text>
          </LinearGradient>
        </Tap>
      </View>
      {editingId && (
        <Tap onPress={() => { setEditingId(null); setText(''); }}>
          <Text style={styles.cancelEdit}>Cancel editing</Text>
        </Tap>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20 },
  title: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3, marginBottom: 10 },
  none: { fontSize: 13.5, fontFamily: fonts.regular, color: colors.muted, marginBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end', gap: 8 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 11, fontFamily: fonts.extraBold },
  bubbleWrap: { maxWidth: '78%' },
  author: { fontSize: 11.5, fontFamily: fonts.extraBold, marginBottom: 3, marginLeft: 12 },
  bubbleMine: { borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 15, paddingVertical: 11 },
  bubbleTheirs: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 20, borderBottomLeftRadius: 6, paddingHorizontal: 15, paddingVertical: 11 },
  textMine: { color: '#fff', fontSize: 14.5, fontFamily: fonts.regular, lineHeight: 20 },
  textTheirs: { color: colors.ink, fontSize: 14.5, fontFamily: fonts.regular, lineHeight: 20 },
  mentionMine: { color: '#fff', fontFamily: fonts.extraBold, textDecorationLine: 'underline' },
  mentionTheirs: { color: colors.coral, fontFamily: fonts.extraBold },
  ts: { fontSize: 10.5, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, marginLeft: 12 },
  tsMine: { textAlign: 'right', marginLeft: 0, marginRight: 6 },
  commentAs: { fontSize: 12, fontFamily: fonts.extraBold, color: colors.muted, letterSpacing: 0.4, marginTop: 12, marginBottom: 8 },
  authors: { gap: 8, paddingRight: 18 },
  authorChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: colors.surface },
  authorChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  dot: { width: 10, height: 10, borderRadius: 5 },
  authorChipText: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  authorChipTextOn: { color: '#fff' },
  tags: { gap: 8, paddingRight: 18, marginTop: 10 },
  tag: { backgroundColor: 'rgba(242,102,139,0.12)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  tagText: { fontSize: 12.5, fontFamily: fonts.extraBold, color: colors.coral },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12 },
  inputWrap: { flex: 1, position: 'relative' },
  suggestBox: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestText: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14.5,
    fontFamily: fonts.regular,
    color: colors.ink,
    maxHeight: 110,
  },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 20, fontFamily: fonts.extraBold },
  cancelEdit: { fontSize: 13, fontFamily: fonts.bold, color: colors.coral, marginTop: 8, textAlign: 'center' },
});
